import { describeUnknownCost, type CostResult } from '@/lib/cost'
import { cn } from '@/lib/utils'

interface CostLabelProps {
  cost: CostResult
  quantity?: number
  className?: string
}

/** Points cost in brass. With a quantity above one it shows the row total and the cost each. */
export function CostLabel({ cost, quantity = 1, className }: CostLabelProps) {
  if (!cost.known) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)} title={describeUnknownCost(cost.reason)}>
        Cost unknown
      </span>
    )
  }
  return (
    <span className={cn('flex flex-col items-end leading-none text-brass print:text-black', className)}>
      <span className="font-display text-[1.375rem] font-bold tabular-nums">
        {cost.cost * quantity}
        <span className="ml-0.5 text-sm font-semibold">pts</span>
      </span>
      {quantity > 1 && <span className="text-xs text-muted-foreground tabular-nums">{cost.cost} each</span>}
    </span>
  )
}
