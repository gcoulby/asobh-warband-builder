import type { RuleTag, SpecialRule } from '@/lib/schema'

const tagLabels: Record<RuleTag, string> = {
  P: 'Personality only',
  L: 'Leadership',
  W: 'Weapon',
  MA: 'Martial art',
  MI: 'Magic item',
  A: 'Alchemical item',
}

/** Short facts about a rule: category, markers, limit and where to find it. */
export function ruleMeta(rule: SpecialRule): string[] {
  const parts: string[] = []
  if (rule.category && rule.category !== 'Trait') parts.push(rule.category)
  for (const tag of rule.tags ?? []) parts.push(tagLabels[tag])
  if (rule.rare !== undefined) parts.push(`Rare, up to ${rule.rare}`)
  const where = [rule.source, rule.page && `p. ${rule.page}`].filter(Boolean).join(' ')
  if (where) parts.push(where)
  return parts
}

/** Words a search should match besides the rule's name. */
export const ruleKeywords = (rule: SpecialRule): string[] =>
  [rule.summary, rule.category ?? '', rule.source ?? '', ...(rule.tags ?? []).map((t) => tagLabels[t])].filter(Boolean)

/** True when every word of the query appears in the rule's name or keywords. */
export function matchesRuleSearch(rule: SpecialRule, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = [rule.name, ...ruleKeywords(rule)].join(' ').toLowerCase()
  return words.every((w) => haystack.includes(w))
}

/** Signed cost for display: +3, -2, 0. */
export const formatRuleCost = (cost: number): string => (cost > 0 ? `+${cost}` : String(cost))
