import { RULE_GROUP_IDS, type RuleGroupId } from '@/data/rule-groups'
import type { SpecialRule } from '@/lib/schema'

/**
 * The one group a rule is listed under. Category wins over markers, so a spell
 * with a Personality marker is still a spell. Personality-only is not a group:
 * it applies across all of them.
 */
export function ruleGroupOf(rule: SpecialRule): RuleGroupId {
  switch (rule.category) {
    case 'Spell':
      return 'spells'
    case 'Runestone':
      return 'runestones'
    case 'Feral Trait':
      return 'feral'
  }
  const tags = rule.tags ?? []
  if (tags.includes('MI')) return 'magic-items'
  if (tags.includes('A')) return 'alchemical'
  if (tags.includes('MA')) return 'martial-arts'
  if (tags.includes('W')) return 'weapons'
  if (tags.includes('L')) return 'leadership'
  return 'traits'
}

export interface RuleGroup {
  id: RuleGroupId
  rules: SpecialRule[]
}

/** Rules sorted into groups in display order, each sorted by name. Empty groups are left out. */
export function groupRules(rules: readonly SpecialRule[]): RuleGroup[] {
  const byGroup = new Map<RuleGroupId, SpecialRule[]>()
  for (const rule of rules) {
    const id = ruleGroupOf(rule)
    const list = byGroup.get(id)
    if (list) list.push(rule)
    else byGroup.set(id, [rule])
  }
  return RULE_GROUP_IDS.flatMap((id) => {
    const list = byGroup.get(id)
    return list ? [{ id, rules: [...list].sort((a, b) => a.name.localeCompare(b.name)) }] : []
  })
}
