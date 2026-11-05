import { profileSchema, profilesFileSchema, type Profile, type Roster } from '@/lib/schema'

export interface ProfilesData {
  rosters: Roster[]
  profiles: Profile[]
  /** Entries that failed validation, by position and id, so a bad entry is reported rather than hidden. */
  errors: { position: number; id?: string }[]
}

const empty = (): ProfilesData => ({ rosters: [], profiles: [], errors: [] })

/** Validates a parsed profiles file. Each profile is checked on its own. */
export function parseProfilesData(data: unknown): ProfilesData {
  const file = profilesFileSchema.safeParse(data)
  if (!file.success) return empty()
  const result: ProfilesData = { rosters: file.data.rosters, profiles: [], errors: [] }
  const rosterIds = new Set(file.data.rosters.map((r) => r.id))
  file.data.profiles.forEach((entry, i) => {
    const parsed = profileSchema.safeParse(entry)
    if (parsed.success && rosterIds.has(parsed.data.roster)) result.profiles.push(parsed.data)
    else {
      const id = typeof entry === 'object' && entry !== null && 'id' in entry ? String(entry.id) : undefined
      result.errors.push({ position: i + 1, id })
    }
  })
  return result
}

/** Roster files placed in src/data/rosters are bundled. Without one, book profiles are simply not offered. */
const bundledFiles = import.meta.glob<unknown>('../data/rosters/*.json', { eager: true, import: 'default' })

let cache: ProfilesData | undefined

export function loadBundledProfiles(): ProfilesData {
  if (cache) return cache
  const merged = empty()
  for (const data of Object.values(bundledFiles)) {
    const parsed = parseProfilesData(data)
    for (const r of parsed.rosters) if (!merged.rosters.some((m) => m.id === r.id)) merged.rosters.push(r)
    merged.profiles.push(...parsed.profiles)
    merged.errors.push(...parsed.errors)
  }
  cache = merged
  return merged
}
