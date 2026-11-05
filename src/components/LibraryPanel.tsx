import { useState } from 'react'
import { Copy, EllipsisVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { BuilderPanel } from '@/components/BuilderPanel'
import { BookProfileList, type BookItem } from '@/components/BookProfileList'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { isNoncombatant, type CostResult } from '@/lib/cost'
import type { Model, Roster, SpecialRule } from '@/lib/schema'

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
  /** Notes on your models left out, such as those for another game or roster. */
  hiddenNotes?: readonly string[]
  /** Book profiles of the chosen roster. Empty when no roster file is bundled. */
  bookItems: readonly BookItem[]
  bookRosters: readonly Roster[]
  bookRoster?: string
  onBookRosterChange: (roster: string) => void
  /** Strict roster fixes the book roster to the warband's. */
  bookRosterLocked: boolean
  onAddProfile: (profileId: string) => void
  className?: string
}

type Source = 'mine' | 'book'

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
  hiddenNotes = [],
  bookItems,
  bookRosters,
  bookRoster,
  onBookRosterChange,
  bookRosterLocked,
  onAddProfile,
  className,
}: LibraryPanelProps) {
  const [source, setSource] = useState<Source>('mine')
  const [query, setQuery] = useState('')
  const hasBook = bookRosters.length > 0
  const showBook = hasBook && source === 'book'
  const q = query.trim().toLowerCase()
  const shown = q
    ? items.filter((i) => [i.model.name, ...i.ruleNames].some((text) => text.toLowerCase().includes(q)))
    : items
  const shownBook = q
    ? bookItems.filter((i) =>
        [i.profile.name, ...i.profile.ruleIds.map((id) => rules.find((r) => r.id === id)?.name ?? id)].some((text) =>
          text.toLowerCase().includes(q),
        ),
      )
    : bookItems
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
            {hasBook ? (
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                value={source}
                onValueChange={(v) => (v === 'mine' || v === 'book') && setSource(v)}
                aria-label="Show models from"
              >
                <ToggleGroupItem value="mine" className="h-8 px-2.5 text-xs pointer-fine:h-8">
                  My models <span className="text-muted-foreground tabular-nums">{items.length}</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="book" className="h-8 px-2.5 text-xs pointer-fine:h-8">
                  From the book
                </ToggleGroupItem>
              </ToggleGroup>
            ) : (
              <h2 className="font-display text-lg font-bold">
                Library <span className="text-sm font-semibold text-muted-foreground tabular-nums">{items.length}</span>
              </h2>
            )}
            <Button size="sm" onClick={onNew}>
              <Plus /> New model
            </Button>
          </div>
          {showBook && (
            <div className="flex items-center gap-2">
              <Label htmlFor="book-roster" className="text-xs text-muted-foreground">
                Roster
              </Label>
              <Select value={bookRoster} onValueChange={onBookRosterChange} disabled={bookRosterLocked}>
                <SelectTrigger id="book-roster" size="sm" className="flex-1">
                  <SelectValue placeholder="Choose a roster" />
                </SelectTrigger>
                <SelectContent>
                  {bookRosters.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {showBook && bookRosterLocked && (
            <p className="text-xs text-muted-foreground">Strict roster is on, so only this roster is offered.</p>
          )}
          {(items.length > 0 || showBook) && (
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
      {showBook ? (
        shownBook.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            {q ? `No profiles match “${query}”.` : 'Choose a roster to see its profiles.'}
          </p>
        ) : (
          <BookProfileList
            items={shownBook}
            rules={rules}
            onAdd={onAddProfile}
            showNoncombatants={showNoncombatants}
            onShowNoncombatantsChange={onShowNoncombatantsChange}
          />
        )
      ) : items.length === 0 ? (
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
      {!showBook &&
        hiddenNotes.map((note) => (
          <p key={note} className="px-3 pt-3 text-xs text-muted-foreground last:pb-3">
            {note}
          </p>
        ))}
    </BuilderPanel>
  )
}
