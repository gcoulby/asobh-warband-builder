import { CURRENT_SCHEMA_VERSION, emptyStoredData, storedDataSchema, type Result, type StoredData } from '@/lib/schema'

/**
 * Each migration takes data at version `from` and returns data at `from + 1`.
 * Add one here for every change to the stored shape.
 */
const migrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {}

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
