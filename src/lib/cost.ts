import type { Combat, Model, Quality, SpecialRule, Warband } from '@/lib/schema'

/**
 * Model cost uses the rulebook formula: ((C × 5 + cost of Traits) × (7 − Q)) / 2,
 * rounded to the nearest point, with a floor of 1 point.
 *
 * A cost is unknown when the model has a special rule that is not in the
 * rules list. A missing cost is never treated as zero.
 */

export type CostResult =
  | { known: true; cost: number }
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

export function modelCost(
  model: Pick<Model, 'quality' | 'combat' | 'ruleIds'>,
  rules: readonly SpecialRule[],
): CostResult {
  const traits = rulesCost(model.ruleIds, rules)
  if (!traits.known) return traits
  return { known: true, cost: formulaCost(model.quality, model.combat, traits.cost) }
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

export interface WarbandTotals {
  /** Sum of every known entry cost times its quantity. */
  total: number
  /** Points spent on Personalities, counted the same way as `total`. */
  personalityTotal: number
  /** True when one or more entries could not be costed, so `total` is a floor. */
  hasUnknown: boolean
  modelCount: number
  /** Rows in the roster. Identical models on one row form one group. */
  groupCount: number
}

export function warbandTotals(
  warband: Pick<Warband, 'entries'>,
  models: readonly Model[],
  rules: readonly SpecialRule[],
): WarbandTotals {
  let total = 0
  let personalityTotal = 0
  let hasUnknown = false
  let modelCount = 0
  for (const entry of warband.entries) {
    modelCount += entry.quantity
    const model = models.find((m) => m.id === entry.modelId)
    const cost = model ? modelCost(model, rules) : null
    if (model && cost?.known) {
      total += cost.cost * entry.quantity
      if (isPersonality(model, rules)) personalityTotal += cost.cost * entry.quantity
    } else hasUnknown = true
  }
  return { total, personalityTotal, hasUnknown, modelCount, groupCount: warband.entries.length }
}

export function describeUnknownCost(reason: CostUnknownReason): string {
  return `Special rule "${reason.ruleId}" is not in your rules. Import it or remove it from the model.`
}
