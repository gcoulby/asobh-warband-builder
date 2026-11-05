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

export interface RosterOption {
  id: string
  label: string
}

/** Rosters from the core rulebook. A warband may stick to one or mix them freely. */
export const rosterOptions: readonly RosterOption[] = [
  { id: 'mixed', label: 'Anything goes' },
  { id: 'lizardmen', label: 'Lizardmen' },
  { id: 'high-elves', label: 'High Elves' },
  { id: 'wood-elves', label: 'Wood Elves' },
  { id: 'dwarves', label: 'Dwarves' },
  { id: 'goblins', label: 'Goblins' },
  { id: 'humans', label: 'Humans' },
  { id: 'undead', label: 'Undead' },
  { id: 'catfolk', label: 'Catfolk' },
  { id: 'ratmen', label: 'Ratmen' },
]

/** Label for a stored roster id. Unknown ids are shown as stored. */
export const rosterLabel = (id: string | undefined): string | undefined =>
  id === undefined ? undefined : (rosterOptions.find((r) => r.id === id)?.label ?? id)

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
