import { useState } from 'react'
import { Copy, EllipsisVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { BuilderPanel } from '@/components/BuilderPanel'
import { ModelRow } from '@/components/ModelRow'
import { NoncombatantsHeader } from '@/components/NoncombatantsHeader'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isNoncombatant, type CostResult } from '@/lib/cost'
import type { Model, SpecialRule } from '@/lib/schema'

export interface LibraryItem {
  model: Model
  cost: CostResult
  imageUrl?: string
  ruleNames: string[]
  /** How many of this model the open warband has. */
  inWarband: number
}

interface LibraryPanelProps {
  items: readonly LibraryItem[]
  rules: readonly SpecialRule[]
  selectedModelId?: string
  onSelect: (modelId: string) => void
  onAdd: (modelId: string) => void
  onNew: () => void
  onDuplicate: (modelId: string) => void
  onDelete: (modelId: string) => void
  showNoncombatants: boolean
  onShowNoncombatantsChange: (shown: boolean) => void
  className?: string
}

/** Every saved model, ready to add to the open warband. */
export function LibraryPanel({
  items,
  rules,
  selectedModelId,
  onSelect,
  onAdd,
  onNew,
  onDuplicate,
  onDelete,
  showNoncombatants,
  onShowNoncombatantsChange,
  className,
}: LibraryPanelProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = q
    ? items.filter((i) => [i.model.name, ...i.ruleNames].some((text) => text.toLowerCase().includes(q)))
    : items
  const fighters = shown.filter((i) => !isNoncombatant(i.cost))
  const noncombatants = shown.filter((i) => isNoncombatant(i.cost))

  const row = ({ model, cost, imageUrl, inWarband }: LibraryItem) => (
    <ModelRow
      key={model.id}
      model={model}
      rules={rules}
      cost={cost}
      imageUrl={imageUrl}
      prefix={inWarband > 0 && <span className="text-primary tabular-nums">{inWarband}× </span>}
      selected={model.id === selectedModelId}
      onOpen={() => onSelect(model.id)}
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary"
            onClick={() => onAdd(model.id)}
            aria-label={`Add ${model.name} to warband`}
          >
            <Plus />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 pointer-fine:w-7" aria-label={`More actions for ${model.name}`}>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onSelect(model.id)}>
                <Pencil /> Edit model
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDuplicate(model.id)}>
                <Copy /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(model.id)}>
                <Trash2 /> Delete from library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  )

  return (
    <BuilderPanel
      label="Library"
      className={className}
      header={
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">
              Library <span className="text-sm font-semibold text-muted-foreground tabular-nums">{items.length}</span>
            </h2>
            <Button size="sm" onClick={onNew}>
              <Plus /> New model
            </Button>
          </div>
          {items.length > 0 && (
            <div className="relative">
              <Label htmlFor="library-panel-search" className="sr-only">
                Search the library
              </Label>
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="library-panel-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or rule"
                className="pl-8"
              />
            </div>
          )}
        </div>
      }
    >
      {items.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">No models yet. Create one with New model.</p>
      ) : shown.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">No models match “{query}”.</p>
      ) : (
        <>
          <ul aria-label="Library models">{fighters.map(row)}</ul>
          {noncombatants.length > 0 && (
            <>
              <NoncombatantsHeader
                count={noncombatants.length}
                shown={showNoncombatants}
                onShownChange={onShowNoncombatantsChange}
              />
              {showNoncombatants && <ul aria-label="Noncombatants">{noncombatants.map(row)}</ul>}
            </>
          )}
        </>
      )}
    </BuilderPanel>
  )
}
