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
  page: z.string().optional(),
  /** Grouping such as Trait or Spell. */
  category: z.string().optional(),
  /** Book the rule comes from. */
  source: z.string().optional(),
  tags: z.array(ruleTagSchema).optional(),
  /** Most figures in a warband that may have this rule. */
  rare: z.number().int().positive().optional(),
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
})
export type Model = z.infer<typeof modelSchema>

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
  pointsCap: z.number().int().positive('The points cap must be above zero.'),
  entries: z.array(warbandEntrySchema),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type Warband = z.infer<typeof warbandSchema>

export const CURRENT_SCHEMA_VERSION = 1

export const storedDataSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  warbands: z.array(warbandSchema),
  models: z.array(modelSchema),
  rules: z.array(specialRuleSchema),
})
export type StoredData = z.infer<typeof storedDataSchema>

export const emptyStoredData = (): StoredData => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  warbands: [],
  models: [],
  rules: [],
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
