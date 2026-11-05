import { z } from 'zod'
import { rulesFileSchema, specialRuleSchema, type SpecialRule } from '@/lib/schema'

export interface RuleEntryError {
  /** Position of the entry in the file's `rules` array, counting from 1. */
  position: number
  id?: string
  messages: string[]
}

export type RulesLoadResult =
  | { ok: false; error: string }
  | {
      ok: true
      name?: string
      rules: SpecialRule[]
      errors: RuleEntryError[]
    }

const formatIssues = (error: z.ZodError): string[] =>
  error.issues.map((issue) => (issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message))

const idOf = (value: unknown): string | undefined => {
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'string' && id.length > 0) return id
  }
  return undefined
}

/**
 * Validates a parsed rules file. The file as a whole must have a `rules` array;
 * each entry is checked on its own so one bad entry does not hide the good ones.
 */
export function parseRulesData(data: unknown): RulesLoadResult {
  const file = rulesFileSchema.safeParse(data)
  if (!file.success) {
    return {
      ok: false,
      error: `This is not a rules file. ${formatIssues(file.error).join('; ')}. A rules file is a JSON object with a "rules" array.`,
    }
  }

  const rules: SpecialRule[] = []
  const errors: RuleEntryError[] = []
  const seen = new Set<string>()

  file.data.rules.forEach((entry, index) => {
    const parsed = specialRuleSchema.safeParse(entry)
    if (!parsed.success) {
      errors.push({ position: index + 1, id: idOf(entry), messages: formatIssues(parsed.error) })
      return
    }
    if (seen.has(parsed.data.id)) {
      errors.push({ position: index + 1, id: parsed.data.id, messages: [`Duplicate id "${parsed.data.id}".`] })
      return
    }
    seen.add(parsed.data.id)
    rules.push(parsed.data)
  })

  return { ok: true, name: file.data.name, rules, errors }
}

export function parseRulesText(text: string): RulesLoadResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON. Check it in a text editor and try again.' }
  }
  return parseRulesData(data)
}

/** Rules files placed in src/data/rules are bundled and offered on the rules screen. */
const bundledFiles = import.meta.glob<unknown>('../data/rules/*.json', { eager: true, import: 'default' })

export interface BundledRulesFile {
  fileName: string
  result: RulesLoadResult
}

export function loadBundledRules(): BundledRulesFile[] {
  return Object.entries(bundledFiles).map(([path, data]) => ({
    fileName: path.split('/').pop() ?? path,
    result: parseRulesData(data),
  }))
}

/** Merges imported rules into existing ones by id. Imported entries win. */
export function mergeRules(existing: readonly SpecialRule[], incoming: readonly SpecialRule[]): SpecialRule[] {
  const byId = new Map(existing.map((r) => [r.id, r]))
  for (const rule of incoming) byId.set(rule.id, rule)
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** A file showing the expected shape, with one example rule to copy. */
export function rulesTemplate(): string {
  return JSON.stringify(
    {
      name: 'My rules',
      rules: [
        {
          id: 'example-rule',
          name: 'Example rule',
          cost: 0,
          summary: 'One line in your own words.',
          page: '',
          category: 'Trait',
          source: 'My house rules',
          tags: [],
        },
      ],
    },
    null,
    2,
  )
}
