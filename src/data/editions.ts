export type EditionId = 'asobh' | 'sbh'

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
  checks: EditionChecks
}

export const editions: readonly Edition[] = [
  {
    id: 'asobh',
    label: 'Advanced Song of Blades and Heroes',
    shortLabel: 'Advanced SBH',
    personalityDivisor: 2,
    personalityShare: 'half',
    checks: { incompatible: incompatibleSupplementRules },
  },
  {
    id: 'sbh',
    label: 'Song of Blades and Heroes (Revised)',
    shortLabel: 'SBH Revised',
    personalityDivisor: 3,
    personalityShare: 'a third of',
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
