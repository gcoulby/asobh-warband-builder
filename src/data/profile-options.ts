import { COMBAT_VALUES, QUALITY_VALUES, type Combat, type Quality } from '@/lib/schema'

export interface ProfileOption<T extends number> {
  value: T
  label: string
}

/** Quality options, best first. A lower target number is a better model. */
export const qualityOptions: readonly ProfileOption<Quality>[] = [...QUALITY_VALUES]
  .map((value) => ({ value, label: `${value}+` }))

export const combatOptions: readonly ProfileOption<Combat>[] = COMBAT_VALUES.map((value) => ({
  value,
  label: String(value),
}))

export const formatQuality = (quality: Quality): string => `${quality}+`

/** Starting profile for a new model: the rulebook's average warrior. */
export const defaultProfile: { quality: Quality; combat: Combat } = { quality: 4, combat: 2 }

/** Starting points cap for a new warband: the rulebook's typical game. Editable per warband. */
export const DEFAULT_POINTS_CAP = 400
