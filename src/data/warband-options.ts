import { DEFAULT_POINTS_CAP } from '@/data/profile-options'

export interface GameSizeOption {
  points: number
  label: string
}

/**
 * Points caps offered when setting up a warband. The rulebook gives 400 as the
 * typical game, with fewer points for a faster game and more for an epic one.
 */
export const gameSizeOptions: readonly GameSizeOption[] = [
  { points: 200, label: 'Short game' },
  { points: 300, label: 'Faster game' },
  { points: DEFAULT_POINTS_CAP, label: 'Typical game' },
  { points: 500, label: 'Large game' },
  { points: 600, label: 'Epic battle' },
]

export const isGameSize = (points: number): boolean => gameSizeOptions.some((o) => o.points === points)

/** Id meaning the warband mixes rosters freely. */
export const MIXED_ROSTER = 'mixed'

/** True when the warband sticks to one roster and has strict roster turned on. */
export const isStrictRoster = (warband: { roster?: string; strictRoster?: boolean }): boolean =>
  Boolean(warband.strictRoster && warband.roster && warband.roster !== MIXED_ROSTER)

export interface PrintNoncombatantOption {
  value: 'all' | 'summary' | 'hide'
  label: string
}

/** How the print sheet shows noncombatants. */
export const printNoncombatantOptions: readonly PrintNoncombatantOption[] = [
  { value: 'summary', label: 'Noncombatants: summary line' },
  { value: 'all', label: 'Noncombatants: show cards' },
  { value: 'hide', label: 'Noncombatants: hide' },
]
