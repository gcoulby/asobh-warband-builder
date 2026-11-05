import { LEADER_RULE_NAME, NONCOMBATANT_MAX_COST, UNIQUE_RULE_NAME } from '@/data/rule-names'
import { hasRuleNamed, isNoncombatant, modelCost, rulesOf, warbandTotals } from '@/lib/cost'
import type { Model, SpecialRule, Warband } from '@/lib/schema'

export type ValidationIssue =
  | { kind: 'empty' }
  | { kind: 'over-cap'; over: number }
  | { kind: 'personalities-over-half'; spent: number; allowed: number }
  | { kind: 'multiple-leaders'; count: number }
  | { kind: 'multiple-leadership-rules'; modelName: string }
  | { kind: 'rare-exceeded'; ruleName: string; count: number; limit: number }
  | { kind: 'unique-exceeded'; modelName: string; count: number }
  | { kind: 'noncombatants'; count: number }
  | { kind: 'unknown-costs' }
  | { kind: 'missing-model'; modelId: string }

/** Errors break a rule of list building. Warnings flag something to agree with your opponent. */
export type IssueSeverity = 'error' | 'warning'

export interface ValidationMessage {
  issue: ValidationIssue
  severity: IssueSeverity
  title: string
  fix: string
}

export function issueSeverity(issue: ValidationIssue): IssueSeverity {
  switch (issue.kind) {
    case 'personalities-over-half':
    case 'multiple-leaders':
    case 'noncombatants':
    case 'unknown-costs':
    case 'empty':
      return 'warning'
    case 'over-cap':
    case 'multiple-leadership-rules':
    case 'rare-exceeded':
    case 'unique-exceeded':
    case 'missing-model':
      return 'error'
  }
}

export function validateWarband(
  warband: Warband,
  models: readonly Model[],
  rules: readonly SpecialRule[],
): ValidationIssue[] {
  if (warband.entries.length === 0) return [{ kind: 'empty' }]

  const issues: ValidationIssue[] = []
  const rows = warband.entries.flatMap((entry) => {
    const model = models.find((m) => m.id === entry.modelId)
    if (!model) {
      issues.push({ kind: 'missing-model', modelId: entry.modelId })
      return []
    }
    return [{ model, quantity: entry.quantity }]
  })

  const totals = warbandTotals(warband, models, rules)
  if (totals.total > warband.pointsCap) {
    issues.push({ kind: 'over-cap', over: totals.total - warband.pointsCap })
  }

  const allowed = Math.floor(warband.pointsCap / 2)
  if (totals.personalityTotal > allowed) {
    issues.push({ kind: 'personalities-over-half', spent: totals.personalityTotal, allowed })
  }
  if (totals.hasUnknown) issues.push({ kind: 'unknown-costs' })

  // Only the Leader rule itself counts. Lead from the Front, Subcommander and
  // other Leadership rules may sit alongside a Leader.
  const leaderCount = rows
    .filter((r) => hasRuleNamed(r.model, rules, LEADER_RULE_NAME))
    .reduce((sum, r) => sum + r.quantity, 0)
  if (leaderCount > 1) issues.push({ kind: 'multiple-leaders', count: leaderCount })

  for (const { model } of rows) {
    const leadership = rulesOf(model, rules).filter((r) => r.tags?.includes('L'))
    if (leadership.length > 1) issues.push({ kind: 'multiple-leadership-rules', modelName: model.name })
  }

  for (const rule of rules) {
    if (rule.rare === undefined) continue
    const count = rows.filter((r) => r.model.ruleIds.includes(rule.id)).reduce((sum, r) => sum + r.quantity, 0)
    if (count > rule.rare) issues.push({ kind: 'rare-exceeded', ruleName: rule.name, count, limit: rule.rare })
  }

  for (const { model, quantity } of rows) {
    if (quantity > 1 && hasRuleNamed(model, rules, UNIQUE_RULE_NAME)) {
      issues.push({ kind: 'unique-exceeded', modelName: model.name, count: quantity })
    }
  }

  const noncombatants = rows
    .filter((r) => isNoncombatant(modelCost(r.model, rules)))
    .reduce((sum, r) => sum + r.quantity, 0)
  if (noncombatants > 0) issues.push({ kind: 'noncombatants', count: noncombatants })

  return issues
}

const points = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`

export function describeIssue(issue: ValidationIssue): ValidationMessage {
  return { ...describeText(issue), severity: issueSeverity(issue) }
}

function describeText(issue: ValidationIssue): Omit<ValidationMessage, 'severity'> {
  switch (issue.kind) {
    case 'empty':
      return { issue, title: 'The warband is empty.', fix: 'Add a model to start the roster.' }
    case 'over-cap':
      return {
        issue,
        title: `Over the points cap by ${points(issue.over)}.`,
        fix: 'Remove a model, lower a quantity, or raise the cap in warband settings.',
      }
    case 'personalities-over-half':
      return {
        issue,
        title: `${points(issue.spent)} on Personalities. The limit is half the cap, ${issue.allowed}.`,
        fix: 'Remove a Personality, or take Personality-only rules off a model.',
      }
    case 'multiple-leaders':
      return {
        issue,
        title: `${issue.count} models have the Leader rule. A warband has one Leader.`,
        fix: 'Keep Leader on one model. Lead from the Front or Subcommander can be on another.',
      }
    case 'multiple-leadership-rules':
      return {
        issue,
        title: `"${issue.modelName}" has more than one Leadership rule.`,
        fix: 'A model may have only one. Remove the others.',
      }
    case 'rare-exceeded':
      return {
        issue,
        title: `${issue.count} models have ${issue.ruleName}. It is limited to ${issue.limit}.`,
        fix: `Lower the quantity or remove ${issue.ruleName} from some models.`,
      }
    case 'unique-exceeded':
      return {
        issue,
        title: `"${issue.modelName}" is Unique but the warband has ${issue.count}.`,
        fix: 'A Unique profile is one per warband. Set its quantity to 1.',
      }
    case 'noncombatants':
      return {
        issue,
        title: `${issue.count} ${issue.count === 1 ? 'noncombatant' : 'noncombatants'} (${NONCOMBATANT_MAX_COST} points or fewer).`,
        fix: 'They are meant for special scenarios, such as villagers or hostages. Agree them with your opponent.',
      }
    case 'unknown-costs':
      return {
        issue,
        title: 'Some costs are unknown, so the total is incomplete.',
        fix: 'Import the special rules your models use.',
      }
    case 'missing-model':
      return {
        issue,
        title: 'A roster row points to a model that no longer exists.',
        fix: 'Remove the row from the roster.',
      }
  }
}
