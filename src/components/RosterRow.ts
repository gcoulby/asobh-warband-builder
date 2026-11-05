import type { CostResult } from '@/lib/cost'
import type { Model, WarbandEntry } from '@/lib/schema'

/** One roster line, resolved for display. */
export interface RosterRow {
  entry: WarbandEntry
  model: Model
  cost: CostResult
  imageUrl?: string
}
