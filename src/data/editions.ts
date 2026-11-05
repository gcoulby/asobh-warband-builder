export type EditionId = 'asobh' | 'sbh'

export interface Book {
  id: string
  label: string
  /** The core book is always in use. Supplements are chosen per warband. */
  core?: boolean
}

/**
 * Supplements for Song of Blades and Heroes. Either game can use them. In
 * Advanced SBH a supplement rule that shares a name with an Advanced SBH rule
 * gives way to it.
 */
export const supplements: readonly Book[] = [
  { id: 'sgd', label: 'Song of Gold and Darkness' },
  { id: 'sww', label: 'Song of Wind and Water' },
  { id: 'sdg', label: 'Song of Deeds and Glory' },
  { id: 'sam', label: 'Song of Arthur and Merlin' },
]

/** Models with one rule cannot be in a warband with models with the other. */
const incompatibleSupplementRules: readonly (readonly [string, string])[] = [
  ['sbh-paladin', 'sbh-evil'],
  ['sbh-sorcerer', 'sbh-cleric'],
]

/** Rule ids that the edition's warband checks look for. */
export interface EditionChecks {
  /** Rules whose models count towards the animal limit of half the points cap. */
  animalRuleIds?: readonly string[]
  /** A swarm needs this many bases or more. */
  swarm?: { ruleId: string; minBases: number }
  /** Models with this rule may be no better than this Quality. */
  qualityFloor?: { ruleId: string; quality: number }
  /** Rules that cannot both appear in one warband. */
  incompatible?: readonly (readonly [string, string])[]
}

export interface Edition {
  id: EditionId
  label: string
  shortLabel: string
  /** Personalities may take up to the points cap divided by this. */
  personalityDivisor: number
  /** Wording for that share before "the cap", such as "half" or "a third of". */
  personalityShare: string
  books: readonly Book[]
  /** True when the edition has the book's roster profiles. */
  hasRosters: boolean
  checks: EditionChecks
}

export const editions: readonly Edition[] = [
  {
    id: 'asobh',
    label: 'Advanced Song of Blades and Heroes',
    shortLabel: 'Advanced SBH',
    personalityDivisor: 2,
    personalityShare: 'half',
    books: supplements,
    hasRosters: true,
    checks: { incompatible: incompatibleSupplementRules },
  },
  {
    id: 'sbh',
    label: 'Song of Blades and Heroes (Revised)',
    shortLabel: 'SBH Revised',
    personalityDivisor: 3,
    personalityShare: 'a third of',
    books: [{ id: 'sbh', label: 'Song of Blades and Heroes', core: true }, ...supplements],
    hasRosters: false,
    checks: {
      animalRuleIds: ['sbh-animal', 'sbh-swarm'],
      swarm: { ruleId: 'sbh-swarm', minBases: 2 },
      qualityFloor: { ruleId: 'sbh-rabble', quality: 4 },
      incompatible: incompatibleSupplementRules,
    },
  },
]

/** Edition of anything saved before editions existed. */
export const DEFAULT_EDITION: EditionId = 'asobh'
