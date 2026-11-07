import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { ChosenRules } from '@/components/ChosenRules'
import { CostLabel } from '@/components/CostLabel'
import { ImageField, type ImageChange } from '@/components/ImageField'
import { ProfilePicker } from '@/components/ProfilePicker'
import { QuantityStepper } from '@/components/QuantityStepper'
import { RuleBrowser } from '@/components/RuleBrowser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { combatOptions, qualityOptions } from '@/data/profile-options'
import { editions } from '@/data/editions'
import { editionOf } from '@/lib/editions'
import type { CostResult } from '@/lib/cost'
import type { Model, Profile, Roster, SpecialRule } from '@/lib/schema'

/** A source's rosters, under the source's name. */
export interface RosterGroup {
  id: string
  label: string
  rosters: readonly Roster[]
}

export type ModelPatch = Partial<Omit<Model, 'id' | 'imageId'>>

const MAX_NAME_LENGTH = 80
const MAX_NOTES_LENGTH = 500
/** Select value for a model with no roster. */
const NO_ROSTER = 'none'

interface ModelPanelProps {
  model: Model
  /** Every loaded rule, so chosen rules always show. */
  rules: readonly SpecialRule[]
  /** Rules offered for adding: those of the model's game and books. */
  pickableRules: readonly SpecialRule[]
  cost: CostResult
  imageUrl?: string
  /** Quantity in the open warband, or undefined when the model is not in it. */
  quantity?: number
  /** How many warbands use this model. */
  usageCount: number
  rulesEmptyState: ReactNode
  /** Book profile the model was made from, if any. */
  profile?: Profile
  /** Name of that profile's roster. */
  rosterName?: string
  /** Rosters the model can belong to, grouped by the source they come from. */
  rosterGroups: readonly RosterGroup[]
  onPatch: (patch: ModelPatch) => void
  onImageChange: (change: ImageChange) => void
  onQuantityChange?: (quantity: number) => void
  onAddToWarband?: () => void
}

/**
 * Edits one model in place. Every change is applied as it is made, so there is
 * no save step. The rules list below scrolls with the panel.
 */
export function ModelPanel({
  model,
  rules,
  pickableRules,
  cost,
  imageUrl,
  quantity,
  usageCount,
  rulesEmptyState,
  profile,
  rosterName,
  rosterGroups,
  onPatch,
  onImageChange,
  onQuantityChange,
  onAddToWarband,
}: ModelPanelProps) {
  const [name, setName] = useState(model.name)
  const nameMissing = name.trim().length === 0
  const nameId = `model-name-${model.id}`
  const notesId = `model-notes-${model.id}`
  const edition = editionOf(model)

  return (
    <div className="flex flex-col">
      <div className="flex gap-3 border-b px-3 py-3">
        <ImageField compact name={name} currentUrl={imageUrl} change={{ kind: 'keep' }} onChange={onImageChange} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <Label htmlFor={nameId} className="sr-only">
              Name
            </Label>
            <Input
              id={nameId}
              value={name}
              autoComplete="off"
              maxLength={MAX_NAME_LENGTH}
              aria-invalid={nameMissing}
              aria-describedby={nameMissing ? `${nameId}-error` : undefined}
              className="font-display text-lg font-bold md:text-lg"
              onChange={(e) => {
                setName(e.target.value)
                const trimmed = e.target.value.trim()
                if (trimmed) onPatch({ name: trimmed })
              }}
            />
            {nameMissing && (
              <p id={`${nameId}-error`} className="mt-1 text-xs text-destructive">
                Give the model a name. The last name is kept until you do.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CostLabel cost={cost} quantity={quantity ?? 1} className="items-start" />
            {quantity !== undefined && onQuantityChange ? (
              <QuantityStepper value={quantity} onChange={onQuantityChange} label={`quantity of ${model.name}`} />
            ) : (
              onAddToWarband && (
                <Button size="sm" onClick={onAddToWarband}>
                  <Plus /> Add to warband
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 border-b px-3 py-3">
        <div className="grid grid-cols-[4.5rem_1fr] items-center gap-x-2 gap-y-2">
          <span className="text-sm font-bold" aria-hidden="true">
            Quality
          </span>
          <ProfilePicker
            label="Quality"
            options={qualityOptions}
            value={model.quality}
            onChange={(quality) => onPatch({ quality })}
          />
          <span className="text-sm font-bold" aria-hidden="true">
            Combat
          </span>
          <ProfilePicker
            label="Combat"
            options={combatOptions}
            value={model.combat}
            onChange={(combat) => onPatch({ combat })}
          />
          <label htmlFor={`model-edition-${model.id}`} className="text-sm font-bold">
            Game
          </label>
          <Select
            value={edition.id}
            onValueChange={(v) =>
              onPatch({ edition: v })
            }
          >
            <SelectTrigger id={`model-edition-${model.id}`} size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {editions.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.shortLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {rosterGroups.length > 0 && (
            <>
              <label htmlFor={`model-roster-${model.id}`} className="text-sm font-bold">
                Roster
              </label>
              <Select
                value={model.roster ?? NO_ROSTER}
                onValueChange={(v) => onPatch({ roster: v === NO_ROSTER ? undefined : v })}
              >
                <SelectTrigger id={`model-roster-${model.id}`} size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ROSTER}>No roster</SelectItem>
                  <SelectSeparator />
                  {rosterGroups.map((g) => (
                    <SelectGroup key={g.id}>
                      <SelectLabel>{g.label}</SelectLabel>
                      {g.rosters.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {profile && (
          <p className="text-xs text-muted-foreground">
            From the book: {profile.name}, {rosterName}.
            {cost.known && cost.formula !== undefined && (
              <> Costs the book's {cost.cost} pts; the formula gives {cost.formula}. Change its stats or rules and the formula applies.</>
            )}
            {profile.choices && <> Book options: {profile.choices.join('; ')}.</>}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold">Special rules</span>
          <ChosenRules
            rules={rules}
            value={model.ruleIds}
            onRemove={(id) => onPatch({ ruleIds: model.ruleIds.filter((r) => r !== id) })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={notesId} className="text-sm font-bold">
            Notes
          </Label>
          <Textarea
            id={notesId}
            rows={2}
            maxLength={MAX_NOTES_LENGTH}
            defaultValue={model.notes ?? ''}
            className="min-h-0"
            onChange={(e) => onPatch({ notes: e.target.value })}
          />
        </div>

        {usageCount > 1 && (
          <p className="text-xs text-muted-foreground">
            This model is in {usageCount} warbands. Changes apply to all of them.
          </p>
        )}
      </div>

      {pickableRules.length > 0 ? (
        <RuleBrowser
          rules={pickableRules}
          value={model.ruleIds}
          onChange={(ruleIds) => onPatch({ ruleIds })}
          title={
            <div className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 truncate text-sm">
                <span className="text-muted-foreground">Special rules for </span>
                <span className="font-bold">{model.name}</span>
              </h3>
              <CostLabel cost={cost} size="sm" className="shrink-0" />
            </div>
          }
        />
      ) : (
        <div className="p-3">{rulesEmptyState}</div>
      )}
    </div>
  )
}
