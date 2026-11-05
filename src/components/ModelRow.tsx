import type { ReactNode } from 'react'
import { Crown, Star } from 'lucide-react'
import { CostLabel } from '@/components/CostLabel'
import { ModelImage } from '@/components/ModelImage'
import { ModelStats } from '@/components/ModelStats'
import { NoncombatantBadge } from '@/components/NoncombatantBadge'
import { isLeader, isNoncombatant, isPersonality, type CostResult } from '@/lib/cost'
import type { Model, SpecialRule } from '@/lib/schema'
import { cn } from '@/lib/utils'

interface ModelRowProps {
  model: Model
  rules: readonly SpecialRule[]
  cost: CostResult
  imageUrl?: string
  /** Shown before the name, such as how many are in the warband. */
  prefix?: ReactNode
  /** Extra line under the rules, such as where the model is used. */
  note?: ReactNode
  selected?: boolean
  /** Opens the model. Without it the name is plain text. */
  onOpen?: () => void
  /** Buttons at the end of the row. They sit above the row's click area. */
  actions?: ReactNode
  className?: string
}

/** A model as one compact list line. With `onOpen`, clicking anywhere on it opens the model. */
export function ModelRow({ model, rules, cost, imageUrl, prefix, note, selected = false, onOpen, actions, className }: ModelRowProps) {
  const leader = isLeader(model, rules)
  const personality = isPersonality(model, rules)
  const ruleNames = model.ruleIds.map((id) => rules.find((r) => r.id === id)?.name ?? `Unknown rule: ${id}`)

  return (
    <li
      aria-label={model.name}
      className={cn(
        'relative flex items-center gap-2.5 border-b border-l-2 border-l-transparent py-1.5 pr-1 pl-2.5 hover:bg-muted/60',
        selected && 'border-l-primary bg-accent hover:bg-accent',
        className,
      )}
    >
      <ModelImage name={model.name} imageUrl={imageUrl} className="w-9 shrink-0 rounded-sm" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              aria-pressed={selected}
              className="truncate text-left after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
            >
              {prefix}
              {model.name}
            </button>
          ) : (
            <span className="truncate">
              {prefix}
              {model.name}
            </span>
          )}
          {leader && (
            <span className="shrink-0 text-primary" title="Leader">
              <Crown className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Leader</span>
            </span>
          )}
          {personality && (
            <span className="shrink-0 text-primary" title="Personality">
              <Star className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Personality</span>
            </span>
          )}
          {isNoncombatant(cost) && <NoncombatantBadge />}
        </p>
        <ModelStats model={model} />
        <p className="truncate text-xs text-muted-foreground">{ruleNames.length > 0 ? ruleNames.join(', ') : 'No special rules'}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      <CostLabel cost={cost} size="sm" className="shrink-0" />
      {actions && <div className="relative z-10 flex shrink-0 items-center">{actions}</div>}
    </li>
  )
}
