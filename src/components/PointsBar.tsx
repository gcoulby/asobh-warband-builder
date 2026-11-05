import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface PointsBarProps {
  total: number
  cap: number
  hasUnknown: boolean
  modelCount: number
  groupCount: number
  className?: string
}

/** Running total against the cap. Announces changes to screen readers. */
export function PointsBar({ total, cap, hasUnknown, modelCount, groupCount, className }: PointsBarProps) {
  const remaining = cap - total
  const over = remaining < 0
  const percent = cap > 0 ? Math.min(100, (total / cap) * 100) : 0

  return (
    <section
      aria-label="Points"
      className={cn('border-t-2 bg-card/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/85', over ? 'border-destructive' : 'border-brass-fill', className)}
    >
      <div className="mx-auto flex max-w-3xl items-end justify-between gap-3">
        <p aria-live="polite" aria-atomic="true" className="flex items-baseline gap-1.5">
          <span className={cn('font-display text-[2rem] leading-none font-bold tabular-nums', over ? 'text-destructive' : 'text-brass')}>
            {total}
            {hasUnknown && <span aria-label=" or more">+</span>}
          </span>
          <span className="font-display text-lg font-semibold text-muted-foreground tabular-nums">/ {cap} pts</span>
          <span className="sr-only">{over ? `, ${-remaining} over the cap` : `, ${remaining} left`}</span>
        </p>
        <div className="text-right text-sm leading-tight" aria-hidden="true">
          <p className={cn('font-bold tabular-nums', over && 'text-destructive')}>
            {over ? `${-remaining} over cap` : `${remaining} left`}
          </p>
          <p className="text-muted-foreground tabular-nums">
            {modelCount} {modelCount === 1 ? 'model' : 'models'} · {groupCount} {groupCount === 1 ? 'group' : 'groups'}
          </p>
        </div>
      </div>
      <Progress
        value={percent}
        aria-label="Points used"
        className={cn(
          'mx-auto mt-1.5 h-2 max-w-3xl rounded-sm',
          over ? '[&>[data-slot=progress-indicator]]:bg-destructive' : '[&>[data-slot=progress-indicator]]:bg-brass-fill',
        )}
      />
    </section>
  )
}
