import { DEFAULT_EDITION, editions, type Edition, type EditionId } from '@/data/editions'
import { sourceLabel } from '@/lib/sources'
import type { Source, SpecialRule } from '@/lib/schema'

export const isEditionId = (id: string | undefined): id is EditionId => editions.some((e) => e.id === id)

/** The edition a warband, model or rule belongs to. Anything without one is Advanced SBH. */
export const editionIdOf = (item: { edition?: string }): EditionId =>
  isEditionId(item.edition) ? item.edition : DEFAULT_EDITION

export const editionById = (id: EditionId): Edition => editions.find((e) => e.id === id) ?? editions[0]

export const editionOf = (item: { edition?: string }): Edition => editionById(editionIdOf(item))

type SourceMeta = Pick<Source, 'id' | 'kind' | 'game' | 'usableIn' | 'name' | 'shortName'>

/** Sources a game can use: those written for it, and supplements that say they work with it. */
export const sourcesFor = <S extends SourceMeta>(sources: readonly S[], edition: EditionId): S[] =>
  sources.filter((s) => s.game === edition || s.usableIn?.includes(edition))

/** True for a source that is always in use in this game: its own core book. */
export const isAlwaysInUse = (source: SourceMeta, edition: EditionId): boolean =>
  source.kind === 'core' && source.game === edition

/** Sources a warband uses: its game's core sources, plus the chosen ones. Without a choice, every source is in use. */
export function sourcesInUse<S extends SourceMeta>(sources: readonly S[], edition: EditionId, chosen?: readonly string[]): S[] {
  return sourcesFor(sources, edition).filter((s) => chosen === undefined || isAlwaysInUse(s, edition) || chosen.includes(s.id))
}

/** What a model or warband may draw rules from: a game, the sources it can use, and those in use. */
export interface RuleScope {
  edition: EditionId
  /** Sources the game can use. */
  allowed: ReadonlySet<string>
  /** Sources the warband has on. Unset means every allowed source. */
  inUse?: ReadonlySet<string>
  /** Labels of known sources, for messages. */
  labels: ReadonlyMap<string, string>
}

export function ruleScope(sources: readonly SourceMeta[], edition: EditionId, chosen?: readonly string[]): RuleScope {
  return {
    edition,
    allowed: new Set(sourcesFor(sources, edition).map((s) => s.id)),
    inUse: chosen === undefined ? undefined : new Set(sourcesInUse(sources, edition, chosen).map((s) => s.id)),
    labels: new Map(sources.map((s) => [s.id, sourceLabel(s)])),
  }
}

/** True when a rule can be used within this scope. A rule without a known source counts only for its own game. */
export function ruleAllowed(rule: SpecialRule, scope: RuleScope): boolean {
  if (rule.book === undefined || !scope.labels.has(rule.book)) return editionIdOf(rule) === scope.edition
  if (!scope.allowed.has(rule.book)) return false
  return scope.inUse === undefined || scope.inUse.has(rule.book)
}

/** Rule names compared without case, spaces or punctuation, so "Snow-Walk" matches "Snow Walk". */
export const ruleNameKey = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Rules offered within a scope. A rule borrowed from another game's supplement
 * is left out when the game has its own rule of that name.
 */
export function rulesFor(rules: readonly SpecialRule[], scope: RuleScope): SpecialRule[] {
  const own = new Set(rules.filter((r) => editionIdOf(r) === scope.edition).map((r) => ruleNameKey(r.name)))
  return rules.filter(
    (r) => ruleAllowed(r, scope) && (editionIdOf(r) === scope.edition || !own.has(ruleNameKey(r.name))),
  )
}

/** Where a rule comes from, for messages: its source, else its game. */
export const ruleOrigin = (rule: SpecialRule, scope: RuleScope): string =>
  (rule.book && scope.labels.get(rule.book)) || editionOf(rule).shortLabel

/** The edition's short label, or nothing for Advanced SBH, so lists only call out the other games. */
export const editionTag = (item: { edition?: string }): string | undefined =>
  editionIdOf(item) === DEFAULT_EDITION ? undefined : editionOf(item).shortLabel
