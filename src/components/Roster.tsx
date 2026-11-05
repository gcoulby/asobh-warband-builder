import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { RosterItem, type RosterItemHandlers } from '@/components/RosterItem'
import type { RosterRow } from '@/components/RosterRow'
import type { SpecialRule } from '@/lib/schema'

interface RosterProps extends RosterItemHandlers {
  rows: readonly RosterRow[]
  rules: readonly SpecialRule[]
  selectedModelId?: string
  newModelId?: string
}

/** Sortable list of roster cards. Drag by the handle, use arrow keys on it, or use Move up and Move down. */
export function Roster({ rows, rules, selectedModelId, newModelId, onMove, ...handlers }: RosterProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = rows.map((r) => r.entry.modelId)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from >= 0 && to >= 0) onMove(from, to)
  }

  const nameOf = (id: string | number) => rows.find((r) => r.entry.modelId === id)?.model.name ?? 'model'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
          onDragOver: ({ active, over }) =>
            over ? `${nameOf(active.id)} is over position ${ids.indexOf(String(over.id)) + 1}.` : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `Dropped ${nameOf(active.id)} at position ${ids.indexOf(String(over.id)) + 1}.` : `Dropped ${nameOf(active.id)}.`,
          onDragCancel: ({ active }) => `Cancelled. ${nameOf(active.id)} is back where it was.`,
        },
        screenReaderInstructions: {
          draggable: 'Press space or enter to pick up. Use the arrow keys to move, space or enter to drop, escape to cancel.',
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2" aria-label="Roster">
          {rows.map((row, index) => (
            <RosterItem
              key={row.entry.modelId}
              row={row}
              index={index}
              count={rows.length}
              rules={rules}
              isSelected={row.entry.modelId === selectedModelId}
              isNew={row.entry.modelId === newModelId}
              onMove={onMove}
              {...handlers}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
