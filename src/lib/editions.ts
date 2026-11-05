import { DEFAULT_EDITION, editions, type Book, type Edition, type EditionId } from '@/data/editions'
import type { SpecialRule } from '@/lib/schema'

export const isEditionId = (id: string | undefined): id is EditionId => editions.some((e) => e.id === id)

/** The edition a warband, model or rule belongs to. Anything without one is Advanced SBH. */
export const editionIdOf = (item: { edition?: string }): EditionId =>
  isEditionId(item.edition) ? item.edition : DEFAULT_EDITION

export const editionById = (id: EditionId): Edition => editions.find((e) => e.id === id) ?? editions[0]

export const editionOf = (item: { edition?: string }): Edition => editionById(editionIdOf(item))

/** Books in use: the core book plus any chosen supplements. Without a choice, every book is in use. */
export function booksInUse(edition: Edition, chosen: readonly string[] | undefined): Book[] {
  if (chosen === undefined) return [...edition.books]
  return edition.books.filter((b) => b.core || chosen.includes(b.id))
}

export const bookLabel = (edition: Edition, id: string | undefined): string | undefined =>
  id === undefined ? undefined : (edition.books.find((b) => b.id === id)?.label ?? id)

/** True when a rule from another edition comes from a supplement this edition can use. */
const isBorrowed = (rule: SpecialRule, edition: Edition): boolean =>
  editionIdOf(rule) !== edition.id && edition.books.some((b) => !b.core && b.id === rule.book)

/**
 * True when a rule can be used under this edition and, if given, these books:
 * the edition's own rules, plus rules from the supplements it can use.
 */
export function ruleAllowed(rule: SpecialRule, edition: EditionId, books?: readonly Book[]): boolean {
  const own = editionIdOf(rule) === edition
  if (!own && !isBorrowed(rule, editionById(edition))) return false
  if (books === undefined || rule.book === undefined) return true
  return books.some((b) => b.id === rule.book)
}

/** Rule names compared without case, spaces or punctuation, so "Snow-Walk" matches "Snow Walk". */
export const ruleNameKey = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '')

const nameKey = (rule: SpecialRule) => ruleNameKey(rule.name)

/**
 * Rules offered under an edition and its books. A supplement rule borrowed
 * from another edition is left out when the edition has its own rule of that name.
 */
export function rulesFor(rules: readonly SpecialRule[], edition: EditionId, books?: readonly Book[]): SpecialRule[] {
  const own = new Set(rules.filter((r) => editionIdOf(r) === edition).map(nameKey))
  return rules.filter(
    (r) => ruleAllowed(r, edition, books) && (editionIdOf(r) === edition || !own.has(nameKey(r))),
  )
}

/** Where a rule comes from, as a warband of this edition would name it: a book, or another game. */
export const ruleOrigin = (rule: SpecialRule, edition: Edition): string =>
  (edition.books.some((b) => b.id === rule.book) ? bookLabel(edition, rule.book) : undefined) ?? editionOf(rule).shortLabel

/** The edition's short label, or nothing for Advanced SBH, so lists only call out the other games. */
export const editionTag = (item: { edition?: string }): string | undefined =>
  editionIdOf(item) === DEFAULT_EDITION ? undefined : editionOf(item).shortLabel

export interface RuleSection {
  id: string
  label: string
  rules: SpecialRule[]
}

/**
 * Rules split by where they come from: each edition's own rules, then each of
 * its books, so the same name never shows twice in one section.
 */
export function ruleSections(rules: readonly SpecialRule[]): RuleSection[] {
  const sections: RuleSection[] = []
  for (const edition of editions) {
    const ofEdition = rules.filter((r) => editionIdOf(r) === edition.id)
    const unbooked = ofEdition.filter((r) => !edition.books.some((b) => b.id === r.book))
    if (unbooked.length > 0) sections.push({ id: edition.id, label: edition.label, rules: unbooked })
    for (const book of edition.books) {
      const inBook = ofEdition.filter((r) => r.book === book.id)
      if (inBook.length === 0) continue
      const label = book.core ? `${edition.shortLabel}: ${book.label}` : `Supplement: ${book.label}`
      sections.push({ id: `${edition.id}-${book.id}`, label, rules: inBook })
    }
  }
  return sections
}
