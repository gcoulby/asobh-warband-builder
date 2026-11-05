import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, Copy, EllipsisVertical, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { ModelCard } from '@/components/ModelCard'
import { QuantityStepper } from '@/components/QuantityStepper'
import type { RosterRow } from '@/components/RosterRow'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  onQuantityChange,
  onMove,
}: RosterItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.entry.modelId,
  })
  const { model, entry } = row

  return (
    <li
      ref={setNodeRef}
      // Drag position is computed per frame, so it has to be an inline style.
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'list-none',
        isDragging && 'relative z-20 opacity-90 motion-safe:scale-[1.02]',
        isNew && 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-150',
      )}
    >
      <ModelCard
        variant="roster"
        model={model}
        rules={rules}
        cost={row.cost}
        quantity={entry.quantity}
        imageUrl={row.imageUrl}
        onOpen={() => onEdit(model.id)}
        className={cn(isSelected && 'outline-2 outline-offset-2 outline-ring', isDragging && 'shadow-lg')}
        footer={
          <div className="flex items-center justify-between gap-1">
            <Button
              ref={setActivatorNodeRef}
              variant="ghost"
              size="icon"
              className="cursor-grab touch-none active:cursor-grabbing"
              aria-label={`Reorder ${model.name}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical />
            </Button>
            <QuantityStepper
              value={entry.quantity}
              onChange={(q) => onQuantityChange(model.id, q)}
              label={`quantity of ${model.name}`}
            />
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => onDuplicate(model.id)} aria-label={`Duplicate ${model.name}`}>
                <Copy />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`More actions for ${model.name}`}>
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEdit(model.id)}>
                    <Pencil /> Edit model
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
          </div>
        }
      />
    </li>
  )
}
