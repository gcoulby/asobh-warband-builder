import { useCallback, useSyncExternalStore } from 'react'
import { z } from 'zod'

export const PREFS_KEY = 'asobh.prefs'

const prefsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).catch('dark'),
  lastWarbandId: z.string().optional().catch(undefined),
  lastModelId: z.string().optional().catch(undefined),
  paperSize: z.enum(['a4', 'letter']).catch('a4'),
})

export type Prefs = z.infer<typeof prefsSchema>
export type ThemePref = Prefs['theme']
export type PaperSize = Prefs['paperSize']

/** Dark by default: games are often played in dim rooms. */
const defaults: Prefs = { theme: 'dark', paperSize: 'a4' }

const read = (): Prefs => {
  try {
    const text = localStorage.getItem(PREFS_KEY)
    if (!text) return defaults
    const parsed = prefsSchema.safeParse(JSON.parse(text))
    return parsed.success ? parsed.data : defaults
  } catch {
    return defaults
  }
}

let current: Prefs = read()
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const write = (patch: Partial<Prefs>) => {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(current))
  } catch {
    // Preferences are cosmetic. Losing them is fine.
  }
  listeners.forEach((l) => l())
}

/** Cosmetic preferences, stored apart from warband data. */
export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const prefs = useSyncExternalStore(subscribe, () => current)
  const update = useCallback((patch: Partial<Prefs>) => write(patch), [])
  return [prefs, update]
}
