import { describeUnknownCost, type CostResult } from '@/lib/cost'
import { cn } from '@/lib/utils'

interface CostLabelProps {
  cost: CostResult
  quantity?: number
  /** `sm` for list rows, `md` for cards and panels. */
  size?: 'sm' | 'md'
  className?: string
}

/** Points cost in brass. With a quantity above one it shows the row total and the cost each. */
export function CostLabel({ cost, quantity = 1, size = 'md', className }: CostLabelProps) {
  if (!cost.known) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)} title={describeUnknownCost(cost.reason)}>
        Cost unknown
      </span>
    )
  }
  return (
    <span className={cn('flex flex-col items-end leading-none text-brass print:text-black', className)}>
      <span className={cn('font-display font-bold tabular-nums', size === 'sm' ? 'text-base' : 'text-[1.375rem]')}>
        {cost.cost * quantity}
        <span className={cn('ml-0.5 font-semibold', size === 'sm' ? 'text-xs' : 'text-sm')}>pts</span>
      </span>
      {quantity > 1 && <span className="text-[0.6875rem] text-muted-foreground tabular-nums">{cost.cost} each</span>}
    </span>
  )
}
