import type { RuleTag, SpecialRule } from '@/lib/schema'

export const ruleTagLabels: Record<RuleTag, string> = {
  P: 'Personality only',
  L: 'Leadership',
  W: 'Weapon',
  MA: 'Martial art',
  MI: 'Magic item',
  A: 'Alchemical item',
}

/** Words a search should match besides the rule's name. */
export const ruleKeywords = (rule: SpecialRule): string[] =>
  [rule.summary, rule.category ?? '', rule.source ?? '', ...(rule.tags ?? []).map((t) => ruleTagLabels[t])].filter(Boolean)

/** True when every word of the query appears in the rule's name or keywords. */
export function matchesRuleSearch(rule: SpecialRule, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = [rule.name, ...ruleKeywords(rule)].join(' ').toLowerCase()
  return words.every((w) => haystack.includes(w))
}

/** What a rule does, in the fullest form loaded: its full text, else its summary. Empty when neither. */
export const ruleDescription = (rule: Pick<SpecialRule, 'summary' | 'text'>): string => rule.text || rule.summary

/** Signed cost for display: +3, -2, 0. */
export const formatRuleCost = (cost: number): string => (cost > 0 ? `+${cost}` : String(cost))

/** Where a rule comes from, such as "ASOBH p. 46". Empty when unknown. */
export const ruleSource = (rule: SpecialRule): string =>
  [rule.source, rule.page && `p. ${rule.page}`].filter(Boolean).join(' ')

export interface RuleMarker {
  short: string
  label: string
}

/** Rulebook markers and limits as short badges with a full label for each. */
export function ruleMarkers(rule: SpecialRule): RuleMarker[] {
  const markers: RuleMarker[] = (rule.tags ?? []).map((tag) => ({ short: tag, label: ruleTagLabels[tag] }))
  if (rule.rare !== undefined) markers.push({ short: `Rare ${rule.rare}`, label: `Rare, up to ${rule.rare} per warband` })
  return markers
}
