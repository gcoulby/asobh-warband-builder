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
  const isLeader = hasLeadership(model, rules)
  const personality = isPersonality(model, rules)

  const title = (
    <span className="font-display text-[1.375rem] leading-tight font-semibold wrap-break-word">{model.name}</span>
  )

  const heading = (
    <div className="flex min-w-0 items-start justify-between gap-2">
      <div className="min-w-0">
        <h3 className={cn(isPrint && 'text-lg')}>
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
        {(isLeader || personality) && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-brass print:text-black">
            {isLeader && (
              <span className="flex items-center gap-1">
                <Crown className="size-4" aria-hidden="true" />
                Leader
              </span>
            )}
            {personality && (
              <span className="flex items-center gap-1">
                <Star className="size-4" aria-hidden="true" />
                Personality
              </span>
            )}
          </p>
        )}
      </div>
      {quantity > 1 && (
        <span className="shrink-0 font-display text-2xl font-bold tabular-nums" aria-label={`${quantity} models`}>
          ×{quantity}
        </span>
      )}
    </div>
  )

  const stats = (
    <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
      <div className="flex gap-1.5">
        <StatToken label="Quality" value={formatQuality(model.quality)} size={isPrint ? 'sm' : 'lg'} />
        <StatToken label="Combat" value={String(model.combat)} size={isPrint ? 'sm' : 'lg'} />
      </div>
      <CostLabel cost={cost} quantity={quantity} />
    </div>
  )

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-sm border bg-card text-card-foreground',
        'border-b-[6px]',
        isLeader ? 'border-b-brass-fill' : 'border-b-base-edge',
        isPrint && 'break-inside-avoid border-black/40 border-b-4 bg-white text-black print:border-b-black',
        className,
      )}
      aria-label={model.name}
    >
      <div className={cn('flex', isLibrary && 'flex-col')}>
        <ModelImage
          name={model.name}
          imageUrl={imageUrl}
          className={cn('shrink-0', isLibrary ? 'w-full' : isPrint ? 'w-20' : 'w-24 min-[400px]:w-28')}
        />
        <div className={cn('flex min-w-0 flex-1 flex-col gap-2 p-2.5', isPrint && 'gap-1 p-2')}>
          {heading}
          {stats}
          <RuleChips ruleIds={model.ruleIds} rules={rules} compact={isPrint} />
          {isPrint && model.notes && <p className="text-xs">{model.notes}</p>}
        </div>
      </div>
      {footer && <div className="relative z-10 border-t bg-card px-1.5 py-1">{footer}</div>}
    </article>
  )
}
