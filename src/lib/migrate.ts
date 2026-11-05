import { bundledSources } from '@/lib/sources-loader'
import { placeRules } from '@/lib/sources'
import {
  CURRENT_SCHEMA_VERSION,
  emptyStoredData,
  specialRuleSchema,
  storedDataSchema,
  type Result,
  type Source,
  type SpecialRule,
  type StoredData,
} from '@/lib/schema'

/**
 * Version 1 kept one list of rules. Version 2 keeps sources. Each bundled
 * source that shares a rule with the old list is added, keeping the summaries
 * and full text written for its rules. Rules found in no bundled source go
 * into custom sources named after their old source label. A warband's chosen books become its chosen sources.
 */
function rulesToSources(data: Record<string, unknown>): Record<string, unknown> {
  const { rules: raw, ...rest } = data
  const rules: SpecialRule[] = (Array.isArray(raw) ? raw : []).flatMap((r) => {
    const parsed = specialRuleSchema.safeParse(r)
    return parsed.success ? [parsed.data] : []
  })
  const byId = new Map(rules.map((r) => [r.id, r]))
  const sources: Source[] = []
  const placed = new Set<string>()
  for (const bundled of bundledSources()) {
    if (!bundled.rules.some((r) => byId.has(r.id))) continue
    sources.push({
      ...bundled,
      rules: bundled.rules.map((rule) => {
        const saved = byId.get(rule.id)
        placed.add(rule.id)
        if (!saved) return rule
        return { ...rule, summary: saved.summary || rule.summary, ...(saved.text ? { text: saved.text } : {}) }
      }),
    })
  }
  // Leftover rules keep their old source label, one custom source per label.
  const leftover = rules
    .filter((r) => !placed.has(r.id))
    .map((r) => {
      const label = r.source?.trim() || 'Imported rules'
      return { ...r, source: label, book: `imported-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }
    })

  // Advanced SBH supplements were always on before sources could be chosen.
  const alwaysOn = bundledSources()
    .filter((b) => b.game === 'asobh' && b.kind !== 'core')
    .map((b) => b.id)
  const warbands = (Array.isArray(data.warbands) ? data.warbands : []).map((w: Record<string, unknown>) => {
    const { books, ...warband } = w
    if (!Array.isArray(books)) return warband
    const sourceIds = warband.edition === 'sbh' ? books : [...books, ...alwaysOn]
    return { ...warband, sourceIds }
  })
  return { ...rest, warbands, sources: placeRules(sources, leftover) }
}

/**
 * Each migration takes data at version `from` and returns data at `from + 1`.
 * Add one here for every change to the stored shape.
 */
const migrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
  1: rulesToSources,
}

export function migrateStoredData(raw: unknown): Result<StoredData> {
  if (raw === null || raw === undefined) return { ok: true, value: emptyStoredData() }
  if (typeof raw !== 'object') return { ok: false, error: 'Saved data is not in a readable shape.' }

  let data = raw as Record<string, unknown>
  let version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0

  if (version > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'Saved data comes from a newer version of the app. Reload to get the latest version.',
    }
  }

  while (version < CURRENT_SCHEMA_VERSION) {
    const step = migrations[version]
    if (!step) return { ok: false, error: `Saved data at version ${version} cannot be upgraded.` }
    data = step(data)
    version += 1
    data.schemaVersion = version
  }

  const parsed = storedDataSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: 'Saved data is damaged and could not be read.' }
  }
  return { ok: true, value: parsed.data }
}
