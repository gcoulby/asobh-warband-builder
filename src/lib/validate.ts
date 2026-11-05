import { LEADER_RULE_NAME, NONCOMBATANT_MAX_COST, UNIQUE_RULE_NAME } from '@/data/rule-names'
import { hasRuleNamed, isNoncombatant, modelCost, rulesOf, warbandTotals } from '@/lib/cost'
import { isStrictRoster, rosterLabel } from '@/data/warband-options'
import { booksInUse, editionById, editionIdOf, editionOf, ruleAllowed, ruleNameKey, ruleOrigin } from '@/lib/editions'
import type { Model, Profile, SpecialRule, Warband } from '@/lib/schema'

export type ValidationIssue =
  | { kind: 'empty' }
  | { kind: 'over-cap'; over: number }
  | { kind: 'personalities-over-limit'; spent: number; allowed: number; share: string }
  | { kind: 'animals-over-half'; spent: number; allowed: number }
  | { kind: 'swarm-too-small'; bases: number; minBases: number }
  | { kind: 'incompatible-rules'; a: string; b: string }
  | { kind: 'quality-too-good'; modelName: string; ruleName: string; quality: number }
  | { kind: 'conflicting-rules'; modelName: string; a: string; b: string }
  | { kind: 'wrong-edition'; modelName: string; edition: string; warbandEdition: string }
  | { kind: 'rule-not-in-use'; modelName: string; ruleName: string; from: string }
  | { kind: 'multiple-leaders'; count: number }
  | { kind: 'multiple-leadership-rules'; modelName: string }
  | { kind: 'rare-exceeded'; ruleName: string; count: number; limit: number }
  | { kind: 'unique-exceeded'; modelName: string; count: number }
  | { kind: 'noncombatants'; count: number }
  | { kind: 'off-roster'; modelName: string; roster: string; warbandRoster: string }
  | { kind: 'no-roster'; modelName: string; warbandRoster: string }
  | { kind: 'profile-rare-exceeded'; profileName: string; count: number; limit: number }
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
    case 'personalities-over-limit':
    case 'animals-over-half':
    case 'multiple-leaders':
    case 'noncombatants':
    case 'no-roster':
    case 'unknown-costs':
    case 'empty':
      return 'warning'
    case 'over-cap':
    case 'multiple-leadership-rules':
    case 'rare-exceeded':
    case 'unique-exceeded':
    case 'off-roster':
    case 'profile-rare-exceeded':
    case 'missing-model':
    case 'swarm-too-small':
    case 'incompatible-rules':
    case 'quality-too-good':
    case 'conflicting-rules':
    case 'wrong-edition':
    case 'rule-not-in-use':
      return 'error'
  }
}

export function validateWarband(
  warband: Warband,
  models: readonly Model[],
  rules: readonly SpecialRule[],
  /** Book profiles, for their prices and their Rare and Unique limits. */
  profiles: readonly Profile[] = [],
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

  const totals = warbandTotals(warband, models, rules, profiles)
  if (totals.total > warband.pointsCap) {
    issues.push({ kind: 'over-cap', over: totals.total - warband.pointsCap })
  }

  const edition = editionOf(warband)
  const allowed = Math.floor(warband.pointsCap / edition.personalityDivisor)
  if (totals.personalityTotal > allowed) {
    issues.push({ kind: 'personalities-over-limit', spent: totals.personalityTotal, allowed, share: edition.personalityShare })
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

  // Profile limits count every model made from the same book profile.
  const byProfile = new Map<string, number>()
  for (const { model, quantity } of rows) {
    if (model.profileId) byProfile.set(model.profileId, (byProfile.get(model.profileId) ?? 0) + quantity)
  }
  for (const [profileId, count] of byProfile) {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile) continue
    const limit = profile.unique ? 1 : profile.rare
    if (limit !== undefined && count > limit) {
      issues.push({ kind: 'profile-rare-exceeded', profileName: profile.name, count, limit })
    }
  }

  if (isStrictRoster(warband) && warband.roster) {
    const warbandRoster = warband.roster
    for (const { model } of rows) {
      if (!model.roster) issues.push({ kind: 'no-roster', modelName: model.name, warbandRoster })
      else if (model.roster !== warbandRoster) {
        issues.push({ kind: 'off-roster', modelName: model.name, roster: model.roster, warbandRoster })
      }
    }
  }

  issues.push(...editionIssues(warband, rows, rules, profiles))

  const noncombatants = rows
    .filter((r) => isNoncombatant(modelCost(r.model, rules, profiles)))
    .reduce((sum, r) => sum + r.quantity, 0)
  if (noncombatants > 0) issues.push({ kind: 'noncombatants', count: noncombatants })

  return issues
}

type Row = { model: Model; quantity: number }

/** Checks that depend on the warband's edition and books, plus rules a model cannot combine. */
function editionIssues(
  warband: Warband,
  rows: readonly Row[],
  rules: readonly SpecialRule[],
  profiles: readonly Profile[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const edition = editionOf(warband)
  const books = booksInUse(edition, warband.books)
  const nameOf = (id: string) => rules.find((r) => r.id === id)?.name ?? id
  const has = (row: Row, id: string) => row.model.ruleIds.includes(id)

  for (const row of rows) {
    const { model } = row
    const modelEdition = editionIdOf(model)
    if (modelEdition !== edition.id) {
      issues.push({
        kind: 'wrong-edition',
        modelName: model.name,
        edition: editionById(modelEdition).shortLabel,
        warbandEdition: edition.shortLabel,
      })
      continue
    }
    for (const rule of rulesOf(model, rules)) {
      if (ruleAllowed(rule, edition.id, books)) continue
      issues.push({ kind: 'rule-not-in-use', modelName: model.name, ruleName: rule.name, from: ruleOrigin(rule, edition) })
    }
    // Exclusions match by name, so a supplement rule also clashes with a same-named rule of the model's own game.
    const chosen = rulesOf(model, rules)
    const seen = new Set<string>()
    for (const rule of chosen) {
      for (const otherName of (rule.excludes ?? []).map(nameOf)) {
        const other = chosen.find((r) => ruleNameKey(r.name) === ruleNameKey(otherName))
        const key = [rule.name, otherName].map(ruleNameKey).sort().join('|')
        if (!other || other.id === rule.id || seen.has(key)) continue
        seen.add(key)
        issues.push({ kind: 'conflicting-rules', modelName: model.name, a: rule.name, b: other.name })
      }
    }
  }

  const { animalRuleIds, swarm, qualityFloor, incompatible } = edition.checks
  if (animalRuleIds) {
    const spent = rows
      .filter((r) => animalRuleIds.some((id) => has(r, id)))
      .reduce((sum, r) => {
        const cost = modelCost(r.model, rules, profiles)
        return sum + (cost.known ? cost.cost * r.quantity : 0)
      }, 0)
    const allowedAnimals = Math.floor(warband.pointsCap / 2)
    if (spent > allowedAnimals) issues.push({ kind: 'animals-over-half', spent, allowed: allowedAnimals })
  }
  if (swarm) {
    const bases = rows.filter((r) => has(r, swarm.ruleId)).reduce((sum, r) => sum + r.quantity, 0)
    if (bases > 0 && bases < swarm.minBases) issues.push({ kind: 'swarm-too-small', bases, minBases: swarm.minBases })
  }
  if (qualityFloor) {
    for (const row of rows) {
      if (has(row, qualityFloor.ruleId) && row.model.quality < qualityFloor.quality) {
        issues.push({
          kind: 'quality-too-good',
          modelName: row.model.name,
          ruleName: nameOf(qualityFloor.ruleId),
          quality: qualityFloor.quality,
        })
      }
    }
  }
  for (const [a, b] of incompatible ?? []) {
    if (rows.some((r) => has(r, a)) && rows.some((r) => has(r, b))) {
      issues.push({ kind: 'incompatible-rules', a: nameOf(a), b: nameOf(b) })
    }
  }
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
    case 'personalities-over-limit':
      return {
        issue,
        title: `${points(issue.spent)} on Personalities. The limit is ${issue.share} the cap, ${issue.allowed}.`,
        fix: 'Remove a Personality, or take Personality-only rules off a model.',
      }
    case 'animals-over-half':
      return {
        issue,
        title: `${points(issue.spent)} on Animals and Swarms. The limit is half the cap, ${issue.allowed}.`,
        fix: 'Remove an Animal or Swarm, or lower a quantity.',
      }
    case 'swarm-too-small':
      return {
        issue,
        title: `The warband has ${issue.bases} Swarm ${issue.bases === 1 ? 'base' : 'bases'}. A swarm needs ${issue.minBases} or more.`,
        fix: 'Add another Swarm base, or remove the swarm.',
      }
    case 'incompatible-rules':
      return {
        issue,
        title: `A warband cannot have both ${issue.a} and ${issue.b} models.`,
        fix: `Remove the ${issue.a} or the ${issue.b} models.`,
      }
    case 'quality-too-good':
      return {
        issue,
        title: `"${issue.modelName}" has ${issue.ruleName}, so its Quality can be no better than ${issue.quality}+.`,
        fix: `Set its Quality to ${issue.quality}+ or worse, or remove ${issue.ruleName}.`,
      }
    case 'conflicting-rules':
      return {
        issue,
        title: `"${issue.modelName}" cannot have both ${issue.a} and ${issue.b}.`,
        fix: 'Remove one of them in the model panel.',
      }
    case 'wrong-edition':
      return {
        issue,
        title: `"${issue.modelName}" is an ${issue.edition} model in an ${issue.warbandEdition} warband.`,
        fix: 'Remove it, or build a model for this edition.',
      }
    case 'rule-not-in-use':
      return {
        issue,
        title: `"${issue.modelName}" has ${issue.ruleName} from ${issue.from}, which this warband does not use.`,
        fix: 'Remove the rule, or turn the book on in warband settings.',
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
    case 'off-roster':
      return {
        issue,
        title: `"${issue.modelName}" is from ${rosterLabel(issue.roster)}, not ${rosterLabel(issue.warbandRoster)}.`,
        fix: 'Remove it, or turn off strict roster in warband settings.',
      }
    case 'no-roster':
      return {
        issue,
        title: `"${issue.modelName}" has no roster.`,
        fix: `Set its roster to ${rosterLabel(issue.warbandRoster)} in the model panel if it belongs there.`,
      }
    case 'profile-rare-exceeded':
      return {
        issue,
        title: `${issue.count} models from the ${issue.profileName} profile. The book allows ${issue.limit}.`,
        fix: 'Lower the quantity or remove some of them.',
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
