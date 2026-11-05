import { z } from 'zod'

export const QUALITY_VALUES = [2, 3, 4, 5, 6] as const
export const COMBAT_VALUES = [0, 1, 2, 3, 4, 5, 6] as const

export const qualitySchema = z.literal(QUALITY_VALUES)
export const combatSchema = z.literal(COMBAT_VALUES)

export type Quality = z.infer<typeof qualitySchema>
export type Combat = z.infer<typeof combatSchema>

/**
 * Rule markers from the rulebook: P Personality only, L Leadership, W Weapon,
 * MA Martial art, MI Magic item, A Alchemical item.
 */
export const RULE_TAGS = ['P', 'L', 'W', 'MA', 'MI', 'A'] as const
export const ruleTagSchema = z.enum(RULE_TAGS)
export type RuleTag = z.infer<typeof ruleTagSchema>

export const specialRuleSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
  name: z.string().trim().min(1, 'name is required'),
  cost: z.number().int('cost must be a whole number'),
  summary: z.string().default(''),
  /**
   * Full rule text, for a personal rules file made from your own copy of a book.
   * Never bundled with the app and left out of share links.
   */
  text: z.string().optional(),
  page: z.string().optional(),
  /** Grouping such as Trait or Spell. */
  category: z.string().optional(),
  /** Book the rule comes from. */
  source: z.string().optional(),
  tags: z.array(ruleTagSchema).optional(),
  /** Most figures in a warband that may have this rule. */
  rare: z.number().int().positive().optional(),
  /** Game the rule's source is written for, such as `sbh`. Filled in from the source. */
  edition: z.string().optional(),
  /** Id of the source the rule belongs to. Filled in from the source. */
  book: z.string().optional(),
  /** Rules a model cannot have alongside this one. */
  excludes: z.array(z.string()).optional(),
})
export type SpecialRule = z.infer<typeof specialRuleSchema>

export const modelSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Give the model a name.'),
  quality: qualitySchema,
  combat: combatSchema,
  ruleIds: z.array(z.string()),
  imageId: z.string().optional(),
  notes: z.string().optional(),
  /** Roster the model belongs to, such as `lizardmen`. */
  roster: z.string().optional(),
  /** Book profile the model was made from, if any. */
  profileId: z.string().optional(),
  /** Game edition the model is built for. Without one it is Advanced SBH. */
  edition: z.string().optional(),
})
export type Model = z.infer<typeof modelSchema>

/** A profile from the book's rosters: a ready-made model. */
export const profileSchema = z.object({
  id: z.string().min(1),
  roster: z.string().min(1),
  name: z.string().min(1),
  quality: qualitySchema,
  combat: combatSchema,
  ruleIds: z.array(z.string()),
  /** Points printed in the book. A model still matching the profile costs this, whatever the formula gives. */
  bookPoints: z.number().int().optional(),
  personality: z.boolean().optional(),
  /** Most models from this profile a warband may field. */
  rare: z.number().int().positive().optional(),
  /** One per warband. */
  unique: z.boolean().optional(),
  /** Options the book gives, such as "Huge Weapon or Bludgeon". The first is used. */
  choices: z.array(z.string()).optional(),
})
export type Profile = z.infer<typeof profileSchema>

export const rosterSchema = z.object({ id: z.string().min(1), label: z.string().min(1) })
export type Roster = z.infer<typeof rosterSchema>

/** A roster together with the source it comes from. */
export interface SourcedRoster extends Roster {
  sourceId: string
}

/** A profile together with the source it comes from. */
export interface SourcedProfile extends Profile {
  sourceId: string
}

/**
 * What a source is: core rulebook, supplement or your own. Every rule and
 * profile belongs to exactly one source.
 */
export const SOURCE_KINDS = ['core', 'supplement', 'custom'] as const
export const sourceKindSchema = z.enum(SOURCE_KINDS)
export type SourceKind = z.infer<typeof sourceKindSchema>

const optionalText = z.string().trim().optional()

/** A book, supplement or custom collection, with its own rules, rosters and profiles. */
export const sourceSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
  name: z.string().trim().min(1, 'Give the source a name.'),
  /** Short label for lists, such as ASOBH. */
  shortName: optionalText,
  kind: sourceKindSchema,
  /** Game the source is written for, such as `asobh`. */
  game: z.string().min(1),
  /** Other games that can use this source's rules. */
  usableIn: z.array(z.string()).optional(),
  author: optionalText,
  publisher: optionalText,
  url: optionalText,
  version: optionalText,
  description: optionalText,
  /** Id of the bundled source this one was added from. */
  origin: z.string().optional(),
  rules: z.array(specialRuleSchema),
  rosters: z.array(rosterSchema),
  profiles: z.array(profileSchema),
})
export type Source = z.infer<typeof sourceSchema>

/** A source as saved to a file. Entries are checked one by one when read. */
export const SOURCE_FILE_FORMAT = 'warband-source'
export const sourceFileSchema = z.object({
  format: z.literal(SOURCE_FILE_FORMAT),
  version: z.literal(1),
  source: z.record(z.string(), z.unknown()),
})

export const warbandEntrySchema = z.object({
  modelId: z.string().min(1),
  quantity: z.number().int().min(1),
})
export type WarbandEntry = z.infer<typeof warbandEntrySchema>

export const warbandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Give the warband a name.'),
  theme: z.string().optional(),
  /** Roster the warband is drawn from, or `mixed` for anything goes. */
  roster: z.string().optional(),
  /** When set with a roster, models from other rosters are flagged. */
  strictRoster: z.boolean().optional(),
  /** Game edition, such as `sbh`. Without one the warband is Advanced SBH. */
  edition: z.string().optional(),
  /** Sources in use, by id. Core sources of the warband's game are always in use. Without a choice, every source is. */
  sourceIds: z.array(z.string()).optional(),
  pointsCap: z.number().int().positive('The points cap must be above zero.'),
  entries: z.array(warbandEntrySchema),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type Warband = z.infer<typeof warbandSchema>

export const CURRENT_SCHEMA_VERSION = 2

export const storedDataSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  warbands: z.array(warbandSchema),
  models: z.array(modelSchema),
  sources: z.array(sourceSchema),
})
export type StoredData = z.infer<typeof storedDataSchema>

export const emptyStoredData = (): StoredData => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  warbands: [],
  models: [],
  sources: [],
})

/** Shape of a rules file the user imports. */
export const rulesFileSchema = z.object({
  name: z.string().optional(),
  rules: z.array(z.unknown()),
})

/** A warband with everything needed to show it elsewhere: shared links and archives. */
export const warbandBundleSchema = z.object({
  warband: warbandSchema,
  models: z.array(modelSchema),
  rules: z.array(specialRuleSchema),
})
export type WarbandBundle = z.infer<typeof warbandBundleSchema>

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }
