import { useMemo } from 'react'
import type { RosterRow } from '@/components/RosterRow'
import { modelCost, warbandTotals, type WarbandTotals } from '@/lib/cost'
import type { Model, SpecialRule, Warband } from '@/lib/schema'
import { describeIssue, validateWarband, type ValidationMessage } from '@/lib/validate'

export interface RosterView {
  rows: RosterRow[]
  totals: WarbandTotals
  messages: ValidationMessage[]
}

/** Resolves a warband's entries into roster rows, totals and validation messages. */
export function useRoster(
  warband: Warband | undefined,
  models: readonly Model[],
  rules: readonly SpecialRule[],
  imageUrls: ReadonlyMap<string, string>,
): RosterView | undefined {
  return useMemo(() => {
    if (!warband) return undefined
    const rows: RosterRow[] = warband.entries.flatMap((entry) => {
      const model = models.find((m) => m.id === entry.modelId)
      if (!model) return []
      return [
        {
          entry,
          model,
          cost: modelCost(model, rules),
          imageUrl: model.imageId ? imageUrls.get(model.imageId) : undefined,
        },
      ]
    })
    return {
      rows,
      totals: warbandTotals(warband, models, rules),
      messages: validateWarband(warband, models, rules).map(describeIssue),
    }
  }, [warband, models, rules, imageUrls])
}
