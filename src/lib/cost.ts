import { NONCOMBATANT_MAX_COST } from '@/data/rule-names'
import type { Combat, Model, Profile, Quality, SpecialRule, Warband } from '@/lib/schema'

/**
 * Model cost uses the rulebook formula: ((C × 5 + cost of Traits) × (7 − Q)) / 2,
 * rounded to the nearest point, with a floor of 1 point.
 *
 * A model made from a book profile, and still matching it, costs the points
 * printed in the book instead. The book prices some profiles differently from
 * the formula, and the book wins.
 *
 * A cost is unknown when the model has a special rule that is not in the
 * rules list. A missing cost is never treated as zero.
 */

export type CostResult =
  | {
      known: true
      cost: number
      /** What the formula gives, set only when the book's price is used and differs from it. */
      formula?: number
    }
  | { known: false; reason: CostUnknownReason }

export type CostUnknownReason = { kind: 'unknown-rule'; ruleId: string }

/** The lowest cost any model can have. */
export const MIN_MODEL_COST = 1

export function formulaCost(quality: Quality, combat: Combat, traitCost: number): number {
  const raw = ((combat * 5 + traitCost) * (7 - quality)) / 2
  return Math.max(MIN_MODEL_COST, Math.round(raw))
}

export function rulesCost(ruleIds: readonly string[], rules: readonly SpecialRule[]): CostResult {
  let total = 0
  for (const ruleId of ruleIds) {
    const rule = rules.find((r) => r.id === ruleId)
    if (!rule) return { known: false, reason: { kind: 'unknown-rule', ruleId } }
    total += rule.cost
  }
  return { known: true, cost: total }
}

const sameRules = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().join('\n') === [...b].sort().join('\n')

/** The book's points for a model, when it was made from a profile and its stats and rules still match. */
export function bookPrice(
  model: Pick<Model, 'quality' | 'combat' | 'ruleIds' | 'profileId'>,
  profiles: readonly Profile[],
): number | undefined {
  if (!model.profileId) return undefined
  const profile = profiles.find((p) => p.id === model.profileId)
  if (!profile || profile.bookPoints === undefined) return undefined
  const matches =
    profile.quality === model.quality && profile.combat === model.combat && sameRules(profile.ruleIds, model.ruleIds)
  return matches ? profile.bookPoints : undefined
}

export function modelCost(
  model: Pick<Model, 'quality' | 'combat' | 'ruleIds' | 'profileId'>,
  rules: readonly SpecialRule[],
  profiles: readonly Profile[] = [],
): CostResult {
  const traits = rulesCost(model.ruleIds, rules)
  if (!traits.known) return traits
  const formula = formulaCost(model.quality, model.combat, traits.cost)
  const book = bookPrice(model, profiles)
  if (book === undefined || book === formula) return { known: true, cost: formula }
  return { known: true, cost: book, formula }
}

/** Rules on a model, in the model's order, skipping any not in the rules list. */
export function rulesOf(model: Pick<Model, 'ruleIds'>, rules: readonly SpecialRule[]): SpecialRule[] {
  return model.ruleIds.flatMap((id) => rules.find((r) => r.id === id) ?? [])
}

/** A model with any Personality-only rule is a Personality. */
export const isPersonality = (model: Pick<Model, 'ruleIds'>, rules: readonly SpecialRule[]): boolean =>
  rulesOf(model, rules).some((r) => r.tags?.includes('P'))

/** A model with a Leadership rule, such as Leader, leads the warband. */
export const isLeader = (model: Pick<Model, 'ruleIds'>, rules: readonly SpecialRule[]): boolean =>
  rulesOf(model, rules).some((r) => r.tags?.includes('L'))

/** True when the model has a rule with this name, ignoring case. */
export const hasRuleNamed = (model: Pick<Model, 'ruleIds'>, rules: readonly SpecialRule[], name: string): boolean =>
  rulesOf(model, rules).some((r) => r.name.trim().toLowerCase() === name.toLowerCase())

/** A model costing 5 points or fewer is a noncombatant: a villager, child or hostage for special scenarios. */
export const isNoncombatant = (cost: CostResult): boolean => cost.known && cost.cost <= NONCOMBATANT_MAX_COST

export interface WarbandTotals {
  /** Sum of every known entry cost times its quantity. */
  total: number
  /** Points spent on Personalities, counted the same way as `total`. */
  personalityTotal: number
  /** True when one or more entries could not be costed, so `total` is a floor. */
  hasUnknown: boolean
  modelCount: number
  /** Models costing 5 points or fewer, counted in `modelCount` too. */
  noncombatantCount: number
  /** Rows in the roster. Identical models on one row form one group. */
  groupCount: number
}

export function warbandTotals(
  warband: Pick<Warband, 'entries'>,
  models: readonly Model[],
  rules: readonly SpecialRule[],
  profiles: readonly Profile[] = [],
): WarbandTotals {
  let total = 0
  let personalityTotal = 0
  let hasUnknown = false
  let modelCount = 0
  let noncombatantCount = 0
  for (const entry of warband.entries) {
    modelCount += entry.quantity
    const model = models.find((m) => m.id === entry.modelId)
    const cost = model ? modelCost(model, rules, profiles) : null
    if (model && cost?.known) {
      total += cost.cost * entry.quantity
      if (isPersonality(model, rules)) personalityTotal += cost.cost * entry.quantity
      if (isNoncombatant(cost)) noncombatantCount += entry.quantity
    } else hasUnknown = true
  }
  return { total, personalityTotal, hasUnknown, modelCount, noncombatantCount, groupCount: warband.entries.length }
}

export function describeUnknownCost(reason: CostUnknownReason): string {
  return `Special rule "${reason.ruleId}" is not in your rules. Import it or remove it from the model.`
}
