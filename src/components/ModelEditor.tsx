import { useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CostLabel } from '@/components/CostLabel'
import { ImageField, type ImageChange } from '@/components/ImageField'
import { ProfilePicker } from '@/components/ProfilePicker'
import { ChosenRules } from '@/components/ChosenRules'
import { RuleBrowser } from '@/components/RuleBrowser'
import { RuleBrowserSheet } from '@/components/RuleBrowserSheet'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { combatOptions, qualityOptions } from '@/data/profile-options'
import { modelCost } from '@/lib/cost'
import { combatSchema, qualitySchema, type Model, type SpecialRule } from '@/lib/schema'

const editorSchema = z.object({
  name: z.string().trim().min(1, 'Give the model a name.').max(80, 'Keep the name under 80 characters.'),
  quality: qualitySchema,
  combat: combatSchema,
  ruleIds: z.array(z.string()),
  notes: z.string().max(500, 'Keep notes under 500 characters.'),
})

export type ModelEditorValues = z.infer<typeof editorSchema>

interface ModelEditorProps {
  model: Model
  rules: readonly SpecialRule[]
  imageUrl?: string
  /** How many warbands use this model. */
  usageCount: number
  rulesEmptyState: ReactNode
  onSubmit: (values: ModelEditorValues, image: ImageChange) => void
  onCancel: () => void
}

export function ModelEditor({
  model,
  rules,
  imageUrl,
  usageCount,
  rulesEmptyState,
  onSubmit,
  onCancel,
}: ModelEditorProps) {
  const [image, setImage] = useState<ImageChange>({ kind: 'keep' })
  const [browserOpen, setBrowserOpen] = useState(false)
  const form = useForm<ModelEditorValues>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      name: model.name,
      quality: model.quality,
      combat: model.combat,
      ruleIds: model.ruleIds,
      notes: model.notes ?? '',
    },
  })

  const [quality, combat, ruleIds, name] = useWatch({
    control: form.control,
    name: ['quality', 'combat', 'ruleIds', 'name'],
  })
  const cost = modelCost({ quality, combat, ruleIds }, rules)
  const setRuleIds = (ids: string[]) => form.setValue('ruleIds', ids, { shouldDirty: true })
  const hasRules = rules.length > 0
  const costNode = (
    <span className="flex items-center gap-2">
      <span className="text-muted-foreground">Model cost</span>
      <CostLabel cost={cost} />
    </span>
  )

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={form.handleSubmit((values) => onSubmit(values, image))}
      noValidate
    >
      <div className="@container/editor flex min-h-0 flex-1">
        <div className="grid min-h-0 flex-1 @[40rem]/editor:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="min-h-0 overflow-y-auto px-4 pb-6">
            <FieldGroup className="gap-4">
              <ImageField name={name} currentUrl={imageUrl} change={image} onChange={setImage} />

              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="model-name">Name</FieldLabel>
                    <Input id="model-name" autoComplete="off" aria-invalid={fieldState.invalid} {...field} />
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="quality"
                render={({ field }) => (
                  <FieldSet>
                    <FieldLegend variant="label">Quality</FieldLegend>
                    <ProfilePicker label="Quality" options={qualityOptions} value={field.value} onChange={field.onChange} />
                  </FieldSet>
                )}
              />

              <Controller
                control={form.control}
                name="combat"
                render={({ field }) => (
                  <FieldSet>
                    <FieldLegend variant="label">Combat</FieldLegend>
                    <ProfilePicker label="Combat" options={combatOptions} value={field.value} onChange={field.onChange} />
                  </FieldSet>
                )}
              />

              <FieldSet>
                <FieldLegend variant="label">Special rules</FieldLegend>
                <ChosenRules rules={rules} value={ruleIds} onRemove={(id) => setRuleIds(ruleIds.filter((r) => r !== id))} />
                {hasRules ? (
                  <div className="@[40rem]/editor:hidden">
                    <Button type="button" variant="outline" onClick={() => setBrowserOpen(true)}>
                      <Plus /> Add special rules
                    </Button>
                  </div>
                ) : (
                  rulesEmptyState
                )}
              </FieldSet>

              <Controller
                control={form.control}
                name="notes"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="model-notes">Notes</FieldLabel>
                    <Textarea id="model-notes" rows={3} aria-invalid={fieldState.invalid} {...field} />
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </Field>
                )}
              />

              {usageCount > 1 && (
                <p className="text-sm text-muted-foreground">
                  This model is in {usageCount} warbands. Changes apply to all of them.
                </p>
              )}
            </FieldGroup>
          </div>
          {hasRules && (
            <section aria-label="Special rules" className="hidden min-h-0 border-l bg-card/40 @[40rem]/editor:flex">
              <RuleBrowser rules={rules} value={ruleIds} onChange={setRuleIds} className="flex-1" />
            </section>
          )}
        </div>
      </div>

      {hasRules && (
        <RuleBrowserSheet
          open={browserOpen}
          onOpenChange={setBrowserOpen}
          rules={rules}
          value={ruleIds}
          onChange={setRuleIds}
          costLabel={costNode}
        />
      )}

      <div className="flex items-center justify-between gap-3 border-t bg-popover px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div aria-live="polite">{costNode}</div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save model</Button>
        </div>
      </div>
    </form>
  )
}
