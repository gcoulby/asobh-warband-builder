import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { BuilderPanel } from '@/components/BuilderPanel'
import { CostLabel } from '@/components/CostLabel'
import { ModelImage } from '@/components/ModelImage'
import { ModelStats } from '@/components/ModelStats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CostResult } from '@/lib/cost'
import type { Model } from '@/lib/schema'
import { cn } from '@/lib/utils'

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
  selectedModelId?: string
  onSelect: (modelId: string) => void
  onAdd: (modelId: string) => void
  onNew: () => void
  className?: string
}

/** Every saved model, ready to add to the open warband. */
export function LibraryPanel({ items, selectedModelId, onSelect, onAdd, onNew, className }: LibraryPanelProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = q
    ? items.filter((i) => [i.model.name, ...i.ruleNames].some((text) => text.toLowerCase().includes(q)))
    : items

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
        <ul aria-label="Library models">
          {shown.map(({ model, cost, imageUrl, ruleNames, inWarband }) => {
            const selected = model.id === selectedModelId
            return (
              <li
                key={model.id}
                className={cn(
                  'relative flex items-center gap-2.5 border-b border-l-2 border-l-transparent py-1.5 pr-1 pl-2.5 hover:bg-muted/60',
                  selected && 'border-l-primary bg-accent hover:bg-accent',
                )}
              >
                <ModelImage name={model.name} imageUrl={imageUrl} className="w-9 shrink-0 rounded-sm" />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onSelect(model.id)}
                    aria-pressed={selected}
                    className="block max-w-full truncate text-left text-sm font-bold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
                  >
                    {inWarband > 0 && <span className="text-primary tabular-nums">{inWarband}× </span>}
                    {model.name}
                  </button>
                  <ModelStats model={model} />
                  {ruleNames.length > 0 && <p className="truncate text-xs text-muted-foreground">{ruleNames.join(', ')}</p>}
                </div>
                <CostLabel cost={cost} size="sm" className="shrink-0" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative z-10 shrink-0 text-primary"
                  onClick={() => onAdd(model.id)}
                  aria-label={`Add ${model.name} to warband`}
                >
                  <Plus />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </BuilderPanel>
  )
}
