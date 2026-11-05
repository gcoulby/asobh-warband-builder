import { isLeader, rulesOf, warbandTotals } from '@/lib/cost'
import type { Model, SpecialRule, Warband } from '@/lib/schema'

export type ValidationIssue =
  | { kind: 'empty' }
  | { kind: 'over-cap'; over: number }
  | { kind: 'personalities-over-half'; spent: number; allowed: number }
  | { kind: 'multiple-leaders'; count: number }
  | { kind: 'multiple-leadership-rules'; modelName: string }
  | { kind: 'rare-exceeded'; ruleName: string; count: number; limit: number }
  | { kind: 'unknown-costs' }
  | { kind: 'missing-model'; modelId: string }

export interface ValidationMessage {
  issue: ValidationIssue
  title: string
  fix: string
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

  const leaderCount = rows.filter((r) => isLeader(r.model, rules)).reduce((sum, r) => sum + r.quantity, 0)
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

  return issues
}

const points = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`

export function describeIssue(issue: ValidationIssue): ValidationMessage {
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
        title: `${issue.count} models have a Leadership rule. A warband normally has one.`,
        fix: 'Keep the Leadership rule on one model, unless you are playing a large battle.',
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
