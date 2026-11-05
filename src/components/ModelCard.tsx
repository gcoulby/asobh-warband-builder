import type { ReactNode } from 'react'
import { Crown, Star } from 'lucide-react'
import { CostLabel } from '@/components/CostLabel'
import { ModelImage } from '@/components/ModelImage'
import { RuleChips } from '@/components/RuleChips'
import { StatToken } from '@/components/StatToken'
import { formatQuality } from '@/data/profile-options'
import { isLeader as hasLeadership, isPersonality, type CostResult } from '@/lib/cost'
import type { Model, SpecialRule } from '@/lib/schema'
import { cn } from '@/lib/utils'

export type ModelCardVariant = 'roster' | 'library' | 'print'

interface ModelCardProps {
  variant: ModelCardVariant
  model: Model
  rules: readonly SpecialRule[]
  cost: CostResult
  quantity?: number
  imageUrl?: string
  /** Makes the name a button that opens the model. */
  onOpen?: () => void
  /** Controls shown along the foot of the card, such as quantity and menu. */
  footer?: ReactNode
  className?: string
}

/**
 * The model card. A flat card face on a coloured base edge, like a painted
 * miniature's base. Models with a Leadership rule stand on brass.
 */
export function ModelCard({
  variant,
  model,
  rules,
  cost,
  quantity = 1,
  imageUrl,
  onOpen,
  footer,
  className,
}: ModelCardProps) {
  const isPrint = variant === 'print'
  const isLibrary = variant === 'library'
  const isRoster = variant === 'roster'
  const isLeader = hasLeadership(model, rules)
  const personality = isPersonality(model, rules)

  const title = (
    <span
      className={cn(
        'font-display leading-tight font-semibold wrap-break-word',
        isPrint ? 'text-lg' : 'text-[1.1875rem]',
      )}
    >
      {model.name}
    </span>
  )

  const heading = (
    <div className="flex min-w-0 items-start justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3>
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
            >
              {title}
              <span className="sr-only">, edit</span>
            </button>
          ) : (
            title
          )}
        </h3>
        {quantity > 1 && (
          <span className="font-display text-lg font-bold text-muted-foreground tabular-nums print:text-black" aria-label={`${quantity} models`}>
            ×{quantity}
          </span>
        )}
        {(isLeader || personality) && (
          <p className="flex flex-wrap items-center gap-x-2 text-xs font-bold text-brass print:text-black">
            {isLeader && (
              <span className="flex items-center gap-0.5">
                <Crown className="size-3.5" aria-hidden="true" />
                Leader
              </span>
            )}
            {personality && (
              <span className="flex items-center gap-0.5">
                <Star className="size-3.5" aria-hidden="true" />
                Personality
              </span>
            )}
          </p>
        )}
      </div>
      <CostLabel cost={cost} quantity={quantity} className="shrink-0" />
    </div>
  )

  const stats = (
    <div className="flex flex-wrap items-start gap-x-2 gap-y-1.5">
      <div className="flex shrink-0 gap-1">
        <StatToken label="Quality" value={formatQuality(model.quality)} size={isPrint ? 'sm' : 'md'} />
        <StatToken label="Combat" value={String(model.combat)} size={isPrint ? 'sm' : 'md'} />
      </div>
      <div className="min-w-[8rem] flex-1 pt-0.5">
        <RuleChips ruleIds={model.ruleIds} rules={rules} compact={isPrint} />
      </div>
    </div>
  )

  return (
    <article
      className={cn(
        '@container/card relative overflow-hidden rounded-sm border bg-card text-card-foreground',
        'border-b-4 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]',
        isLeader ? 'border-b-brass-fill' : 'border-b-base-edge',
        isPrint && 'break-inside-avoid border-black/40 bg-white text-black shadow-none print:border-b-black',
        className,
      )}
      aria-label={model.name}
    >
      <div className={cn('flex flex-col', isRoster && footer && '@[36rem]/card:flex-row')}>
        <div className={cn('flex min-w-0 flex-1', isLibrary && 'flex-col')}>
          <ModelImage
            name={model.name}
            imageUrl={imageUrl}
            className={cn(
              'shrink-0',
              isLibrary ? 'w-full' : isPrint ? 'w-16' : 'w-16 self-start @[36rem]/card:w-20',
            )}
          />
          <div className={cn('flex min-w-0 flex-1 flex-col gap-1.5 px-2.5 py-2', isPrint && 'gap-1 p-2')}>
            {heading}
            {stats}
            {isPrint && model.notes && <p className="text-xs">{model.notes}</p>}
          </div>
        </div>
        {footer && (
          <div
            className={cn(
              'relative z-10 flex items-center border-t bg-muted/40 px-1 py-0.5',
              isRoster && '@[36rem]/card:border-t-0 @[36rem]/card:border-l @[36rem]/card:bg-transparent',
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </article>
  )
}
