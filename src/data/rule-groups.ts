/** Groups the special rules browser offers, in display order. */
export const RULE_GROUP_IDS = [
  'traits',
  'weapons',
  'leadership',
  'martial-arts',
  'spells',
  'magic-items',
  'runestones',
  'feral',
  'alchemical',
] as const
export type RuleGroupId = (typeof RULE_GROUP_IDS)[number]

export const ruleGroupLabels: Record<RuleGroupId, string> = {
  traits: 'Traits',
  weapons: 'Weapons',
  leadership: 'Leadership',
  'martial-arts': 'Martial arts',
  spells: 'Spells',
  'magic-items': 'Magic items',
  runestones: 'Runestones',
  feral: 'Feral',
  alchemical: 'Alchemical',
}

export const isRuleGroupId = (value: string): value is RuleGroupId =>
  (RULE_GROUP_IDS as readonly string[]).includes(value)
