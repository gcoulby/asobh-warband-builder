import type { SourceKind } from '@/lib/schema'

export const sourceKindLabels: Record<SourceKind, string> = {
  core: 'Core rules',
  supplement: 'Supplement',
  custom: 'Custom',
}

export const sourceKindOptions: readonly { value: SourceKind; label: string }[] = [
  { value: 'core', label: 'Core rules: always in use for its game' },
  { value: 'supplement', label: 'Supplement: each warband chooses' },
  { value: 'custom', label: 'Custom: your own rules and profiles' },
]

/** Rule kinds offered when adding a rule. Any other kind can be typed in. */
export const ruleCategoryOptions: readonly string[] = ['Trait', 'Spell', 'Runestone']
