import { z } from 'zod'
import { DEFAULT_EDITION } from '@/data/editions'
import { MIXED_ROSTER } from '@/data/warband-options'
import {
  profileSchema,
  rosterSchema,
  rulesFileSchema,
  SOURCE_FILE_FORMAT,
  sourceFileSchema,
  sourceKindSchema,
  sourceSchema,
  specialRuleSchema,
  type Profile,
  type Roster,
  type Source,
  type SourcedProfile,
  type SourcedRoster,
  type SpecialRule,
} from '@/lib/schema'

/** One entry that failed its checks, by list and position, so it is reported rather than dropped silently. */
export interface SourceEntryError {
  list: 'rules' | 'rosters' | 'profiles'
  /** Position in the list, counting from 1. */
  position: number
  id?: string
  messages: string[]
}

export type SourceReadResult =
  | { ok: false; error: string }
  | { ok: true; source: Source; errors: SourceEntryError[] }

const formatIssues = (error: z.ZodError): string[] =>
  error.issues.map((issue) => (issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message))

const idOf = (value: unknown): string | undefined =>
  typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string' ? value.id : undefined

/** Keeps the valid entries of a list and reports the rest. Duplicate ids count as invalid. */
function readList<T extends { id: string }>(
  list: 'rules' | 'rosters' | 'profiles',
  entries: unknown,
  schema: z.ZodType<T>,
  errors: SourceEntryError[],
): T[] {
  if (!Array.isArray(entries)) return []
  const out: T[] = []
  const seen = new Set<string>()
  entries.forEach((entry, i) => {
    const parsed = schema.safeParse(entry)
    if (!parsed.success) {
      errors.push({ list, position: i + 1, id: idOf(entry), messages: formatIssues(parsed.error) })
    } else if (seen.has(parsed.data.id)) {
      errors.push({ list, position: i + 1, id: parsed.data.id, messages: [`Duplicate id "${parsed.data.id}".`] })
    } else {
      seen.add(parsed.data.id)
      out.push(parsed.data)
    }
  })
  return out
}

/** Fields a rule takes from its source. They are not kept on rules inside a source. */
const withoutSourceFields = ({ edition: _e, book: _b, source: _s, ...rule }: SpecialRule): SpecialRule => rule

const slug = (text: string) =>
  text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Reads a source file. Also accepts a plain rules file (`{ name, rules }`),
 * which becomes a custom source. Each rule, roster and profile is checked on
 * its own so one bad entry does not hide the good ones.
 */
export function readSourceData(data: unknown, fallbackName = 'Imported rules'): SourceReadResult {
  const file = sourceFileSchema.safeParse(data)
  if (file.success) {
    const raw = file.data.source
    const meta = sourceSchema.omit({ rules: true, rosters: true, profiles: true }).safeParse(raw)
    if (!meta.success) return { ok: false, error: `The source details are not valid. ${formatIssues(meta.error).join('; ')}.` }
    const errors: SourceEntryError[] = []
    const rules = readList('rules', raw.rules, specialRuleSchema, errors).map(withoutSourceFields)
    const rosters = readList('rosters', raw.rosters, rosterSchema, errors)
    const rosterIds = new Set(rosters.map((r) => r.id))
    const profiles = readList('profiles', raw.profiles, profileSchema, errors).filter((p, i) => {
      if (rosterIds.has(p.roster)) return true
      errors.push({ list: 'profiles', position: i + 1, id: p.id, messages: [`Roster "${p.roster}" is not in this source.`] })
      return false
    })
    return { ok: true, source: { ...meta.data, rules, rosters, profiles }, errors }
  }

  const rulesFile = rulesFileSchema.safeParse(data)
  if (rulesFile.success) {
    const errors: SourceEntryError[] = []
    const rules = readList('rules', rulesFile.data.rules, specialRuleSchema, errors)
    const name = rulesFile.data.name?.trim() || fallbackName
    const game = rules.find((r) => r.edition)?.edition ?? DEFAULT_EDITION
    return {
      ok: true,
      source: {
        id: `custom-${slug(name) || 'rules'}`,
        name,
        kind: 'custom',
        game,
        rules: rules.map(withoutSourceFields),
        rosters: [],
        profiles: [],
      },
      errors,
    }
  }

  return {
    ok: false,
    error: 'This is not a source file. A source file has "format": "warband-source" and a "source" with rules and profiles.',
  }
}

export function readSourceText(text: string, fallbackName?: string): SourceReadResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON. Check it in a text editor and try again.' }
  }
  return readSourceData(data, fallbackName)
}

/** The file text for a source, ready to download and import again. */
export const sourceFileText = (source: Source): string =>
  `${JSON.stringify({ format: SOURCE_FILE_FORMAT, version: 1, source }, null, 2)}\n`

/** A source label for lists: its short name, else its name. */
export const sourceLabel = (source: Pick<Source, 'name' | 'shortName'>): string => source.shortName || source.name

export interface Flattened {
  /** Every rule, with its source's game, id and label filled in. */
  rules: SpecialRule[]
  profiles: SourcedProfile[]
  rosters: SourcedRoster[]
}

/** Rules, profiles and rosters of every source in one list each, tagged with where they come from. */
export function flattenSources(sources: readonly Source[]): Flattened {
  const rules: SpecialRule[] = []
  const profiles: SourcedProfile[] = []
  const rosters: SourcedRoster[] = []
  for (const source of sources) {
    for (const rule of source.rules) rules.push({ ...rule, edition: source.game, book: source.id, source: sourceLabel(source) })
    for (const roster of source.rosters) rosters.push({ ...roster, sourceId: source.id })
    for (const profile of source.profiles) profiles.push({ ...profile, sourceId: source.id })
  }
  rules.sort((a, b) => a.name.localeCompare(b.name))
  return { rules, profiles, rosters }
}

/**
 * Ids in `source` already used by a different source. Rule and roster ids are
 * shared across sources, because models and warbands refer to them by id alone.
 */
export function idClashes(source: Source, others: readonly Source[]): string[] {
  const rest = others.filter((o) => o.id !== source.id)
  const ruleIds = new Set(rest.flatMap((o) => o.rules.map((r) => r.id)))
  const rosterIds = new Set(rest.flatMap((o) => o.rosters.map((r) => r.id)))
  return [
    ...source.rules.filter((r) => ruleIds.has(r.id)).map((r) => `rule "${r.name}" (${r.id})`),
    ...source.rosters.filter((r) => rosterIds.has(r.id)).map((r) => `roster "${r.label}" (${r.id})`),
  ]
}

/** An id not yet taken, built from a name: `name`, then `name-2` and so on. */
export function freeId(name: string, taken: ReadonlySet<string>, prefix = ''): string {
  const base = `${prefix}${slug(name) || 'item'}`
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

/** A new, empty custom source. */
export const newCustomSource = (id: string, name: string, game: string): Source => ({
  id,
  name,
  kind: 'custom',
  game,
  rules: [],
  rosters: [],
  profiles: [],
})

export const isSourceKind = (value: string): value is Source['kind'] => sourceKindSchema.safeParse(value).success

/** Label for a stored roster id. Anything goes and unknown ids are shown as stored. */
export function rosterLabel(id: string | undefined, rosters: readonly Roster[]): string | undefined {
  if (id === undefined) return undefined
  if (id === MIXED_ROSTER) return 'Anything goes'
  return rosters.find((r) => r.id === id)?.label ?? id
}

/** A profile as the input for a new library model. */
export const profileDraft = (profile: Profile) => ({
  name: profile.name,
  quality: profile.quality,
  combat: profile.combat,
  ruleIds: [...profile.ruleIds],
  roster: profile.roster,
  profileId: profile.id,
  ...(profile.choices ? { notes: `Book options: ${profile.choices.join('; ')}` } : {}),
})

/**
 * Adds rules that arrived with a shared warband and are not yet known. Each
 * goes into its own source when that source is present, else into a custom
 * source named after where the rule says it comes from.
 */
export function placeRules(sources: readonly Source[], incoming: readonly SpecialRule[]): Source[] {
  const known = new Set(sources.flatMap((s) => s.rules.map((r) => r.id)))
  const next = sources.map((s) => ({ ...s, rules: [...s.rules] }))
  for (const rule of incoming) {
    if (known.has(rule.id)) continue
    known.add(rule.id)
    const sourceId = rule.book ?? 'imported-rules'
    let target = next.find((s) => s.id === sourceId)
    if (!target) {
      target = newCustomSource(sourceId, rule.source ?? 'Imported rules', rule.edition ?? DEFAULT_EDITION)
      next.push(target)
    }
    target.rules.push(withoutSourceFields(rule))
  }
  return next
}
