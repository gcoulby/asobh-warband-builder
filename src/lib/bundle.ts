import type { Model, SpecialRule, Warband, WarbandBundle } from '@/lib/schema'

/** Collects a warband with the models and rules it uses. */
export function bundleWarband(
  warband: Warband,
  data: { models: readonly Model[]; rules: readonly SpecialRule[] },
): WarbandBundle {
  const modelIds = new Set(warband.entries.map((e) => e.modelId))
  const models = data.models.filter((m) => modelIds.has(m.id))
  const ruleIds = new Set(models.flatMap((m) => m.ruleIds))
  const rules = data.rules.filter((r) => ruleIds.has(r.id))
  return { warband, models, rules }
}

export interface ImportedBundle {
  warband: Warband
  models: WarbandBundle['models']
  /** Maps each model id in the bundle to its new id. */
  modelIdMap: Map<string, string>
}

/**
 * Gives a bundle fresh ids so it can be saved alongside existing data without
 * overwriting anything.
 */
export function rekeyBundle(bundle: WarbandBundle, newId: () => string, now: number): ImportedBundle {
  const modelIdMap = new Map(bundle.models.map((m) => [m.id, newId()]))
  const models = bundle.models.map((m) => ({ ...m, id: modelIdMap.get(m.id) ?? newId() }))
  const warband: Warband = {
    ...bundle.warband,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    entries: bundle.warband.entries
      .filter((e) => modelIdMap.has(e.modelId))
      .map((e) => ({ ...e, modelId: modelIdMap.get(e.modelId) ?? e.modelId })),
  }
  return { warband, models, modelIdMap }
}
