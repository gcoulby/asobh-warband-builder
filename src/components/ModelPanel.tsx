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
import { Textarea } from '@/components/ui/textarea'
import { combatOptions, qualityOptions } from '@/data/profile-options'
import type { CostResult } from '@/lib/cost'
import type { Model, SpecialRule } from '@/lib/schema'

export type ModelPatch = Partial<Omit<Model, 'id' | 'imageId'>>

const MAX_NAME_LENGTH = 80
const MAX_NOTES_LENGTH = 500

interface ModelPanelProps {
  model: Model
  rules: readonly SpecialRule[]
  cost: CostResult
  imageUrl?: string
  /** Quantity in the open warband, or undefined when the model is not in it. */
  quantity?: number
  /** How many warbands use this model. */
  usageCount: number
  rulesEmptyState: ReactNode
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
  cost,
  imageUrl,
  quantity,
  usageCount,
  rulesEmptyState,
  onPatch,
  onImageChange,
  onQuantityChange,
  onAddToWarband,
}: ModelPanelProps) {
  const [name, setName] = useState(model.name)
  const nameMissing = name.trim().length === 0
  const nameId = `model-name-${model.id}`
  const notesId = `model-notes-${model.id}`

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
        </div>

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

      {rules.length > 0 ? (
        <RuleBrowser
          rules={rules}
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
