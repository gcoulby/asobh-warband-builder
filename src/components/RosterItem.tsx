import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, Copy, Crown, EllipsisVertical, GripVertical, Star, Trash2 } from 'lucide-react'
import { CostLabel } from '@/components/CostLabel'
import { ModelImage } from '@/components/ModelImage'
import { ModelStats } from '@/components/ModelStats'
import type { RosterRow } from '@/components/RosterRow'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isLeader, isPersonality } from '@/lib/cost'
import type { SpecialRule } from '@/lib/schema'
import { cn } from '@/lib/utils'

export interface RosterItemHandlers {
  onEdit: (modelId: string) => void
  onDuplicate: (modelId: string) => void
  onRemove: (modelId: string) => void
  onQuantityChange: (modelId: string, quantity: number) => void
  onMove: (from: number, to: number) => void
}

interface RosterItemProps extends RosterItemHandlers {
  row: RosterRow
  index: number
  count: number
  rules: readonly SpecialRule[]
  isSelected: boolean
  isNew: boolean
}

/** One warband line: picture, name, profile and rules, cost and actions. Selecting it opens the model. */
export function RosterItem({
  row,
  index,
  count,
  rules,
  isSelected,
  isNew,
  onEdit,
  onDuplicate,
  onRemove,
  onMove,
}: RosterItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.entry.modelId,
  })
  const { model, entry } = row
  const leader = isLeader(model, rules)
  const personality = isPersonality(model, rules)
  const ruleNames = model.ruleIds.map((id) => rules.find((r) => r.id === id)?.name ?? `Unknown rule: ${id}`)

  return (
    <li
      ref={setNodeRef}
      // Drag position is computed per frame, so it has to be an inline style.
      style={{ transform: CSS.Transform.toString(transform), transition }}
      aria-label={model.name}
      className={cn(
        'relative flex items-center gap-2 border-b border-l-2 border-l-transparent bg-card py-1.5 pr-1 pl-0.5 hover:bg-muted/60',
        isSelected && 'border-l-primary bg-accent hover:bg-accent',
        isDragging && 'z-20 shadow-lg',
        isNew && 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150',
      )}
    >
      <Button
        ref={setActivatorNodeRef}
        variant="ghost"
        size="icon"
        className="relative z-10 w-6 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing pointer-fine:w-6"
        aria-label={`Reorder ${model.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical />
      </Button>
      <ModelImage name={model.name} imageUrl={row.imageUrl} className="w-10 shrink-0 rounded-sm" />
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <button
            type="button"
            onClick={() => onEdit(model.id)}
            aria-pressed={isSelected}
            className="truncate text-left after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
          >
            {model.name}
          </button>
          {entry.quantity > 1 && (
            <span className="shrink-0 text-muted-foreground tabular-nums" aria-label={`${entry.quantity} models`}>
              [{entry.quantity}]
            </span>
          )}
          {leader && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-primary">
              <Crown className="size-3.5" aria-hidden="true" /> Leader
            </span>
          )}
          {personality && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-primary">
              <Star className="size-3.5" aria-hidden="true" /> Personality
            </span>
          )}
        </h3>
        <ModelStats model={model} />
        {ruleNames.length > 0 && <p className="text-xs text-muted-foreground">{ruleNames.join(', ')}</p>}
      </div>
      <CostLabel cost={row.cost} quantity={entry.quantity} size="sm" className="shrink-0" />
      <div className="relative z-10 flex shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`More actions for ${model.name}`}>
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onDuplicate(model.id)}>
              <Copy /> Duplicate as new model
            </DropdownMenuItem>
            <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(index, index - 1)}>
              <ArrowUp /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={index === count - 1} onSelect={() => onMove(index, index + 1)}>
              <ArrowDown /> Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onRemove(model.id)}>
              <Trash2 /> Remove from warband
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}
