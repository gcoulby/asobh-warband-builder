import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { DEFAULT_EDITION, editions } from '@/data/editions'
import { gameSizeOptions, isGameSize, MIXED_ROSTER } from '@/data/warband-options'
import { editionById, editionIdOf, isAlwaysInUse, isEditionId, sourcesFor } from '@/lib/editions'
import { sourceLabel } from '@/lib/sources'
import type { Source, SourcedRoster } from '@/lib/schema'
import type { WarbandSettings } from '@/stores/data-store'

const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Give the warband a name.').max(80, 'Keep the name under 80 characters.'),
  theme: z.string().max(120, 'Keep the theme under 120 characters.'),
  edition: z.string(),
  sourceIds: z.array(z.string()),
  roster: z.string(),
  strictRoster: z.boolean(),
  pointsCap: z
    .number({ error: 'Enter the points cap as a number.' })
    .int('Use a whole number.')
    .min(1, 'The points cap must be above zero.')
    .max(10000, 'The points cap must be 10000 or less.'),
})

type SettingsValues = z.infer<typeof settingsSchema>

/** Select values that stand for "no roster" and "a points cap not in the list". */
const NO_ROSTER = 'none'
const CUSTOM_SIZE = 'custom'

interface WarbandSettingsDialogProps {
  /** Your sources, to choose from and to list rosters. */
  sources: readonly Source[]
  rosters: readonly SourcedRoster[]
  open: boolean
  title: string
  submitLabel: string
  initial: WarbandSettings
  onOpenChange: (open: boolean) => void
  onSubmit: (settings: WarbandSettings) => void
}

export function WarbandSettingsDialog({
  sources,
  rosters,
  open,
  title,
  submitLabel,
  initial,
  onOpenChange,
  onSubmit,
}: WarbandSettingsDialogProps) {
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      name: initial.name,
      edition: editionIdOf(initial),
      // Without a saved choice every source is ticked, whichever game is picked.
      sourceIds: initial.sourceIds ?? sources.map((x) => x.id),
      theme: initial.theme ?? '',
      roster: initial.roster ?? '',
      strictRoster: initial.strictRoster ?? false,
      pointsCap: initial.pointsCap,
    },
  })
  const [customChosen, setCustomChosen] = useState(false)
  const roster = useWatch({ control: form.control, name: 'roster' })
  const editionId = useWatch({ control: form.control, name: 'edition' })
  const edition = editionById(isEditionId(editionId) ? editionId : DEFAULT_EDITION)
  const usable = sourcesFor(sources, edition.id)
  const coreSources = usable.filter((x) => isAlwaysInUse(x, edition.id))
  const optional = usable.filter((x) => !isAlwaysInUse(x, edition.id))
  const usableIds = new Set(usable.map((x) => x.id))
  const rosterChoices = rosters.filter((r) => usableIds.has(r.sourceId))
  const hasRosters = rosterChoices.length > 0
  const canBeStrict = hasRosters && Boolean(roster) && roster !== MIXED_ROSTER

  const handleOpenChange = (next: boolean) => {
    if (!next) setCustomChosen(false)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Name the warband, pick its game, size and roster.</DialogDescription>
        </DialogHeader>
        <form
          id="warband-settings"
          noValidate
          className="-mx-4 min-h-0 overflow-y-auto px-4 py-1"
          onSubmit={form.handleSubmit((v) => {
            setCustomChosen(false)
            onSubmit({
              name: v.name,
              theme: v.theme.trim() || undefined,
              edition: edition.id,
              sourceIds: optional.filter((x) => v.sourceIds.includes(x.id)).map((x) => x.id),
              roster: hasRosters ? v.roster || undefined : undefined,
              strictRoster: canBeStrict && v.strictRoster ? true : undefined,
              pointsCap: v.pointsCap,
            })
          })}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="warband-name">Name</FieldLabel>
                  <Input id="warband-name" autoComplete="off" aria-invalid={fieldState.invalid} {...field} />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="edition"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="warband-edition">Game</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="warband-edition" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {editions.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>Sets which special rules and warband checks apply.</FieldDescription>
                </Field>
              )}
            />
            {optional.length > 0 && (
              <Controller
                control={form.control}
                name="sourceIds"
                render={({ field }) => (
                  <FieldSet>
                    <FieldLegend variant="label">Sources</FieldLegend>
                    <FieldDescription>
                      {coreSources.length > 0
                        ? `${coreSources.map(sourceLabel).join(' and ')} always in use. `
                        : ''}
                      Rules and profiles from sources left out are not offered, and models using them are flagged.
                    </FieldDescription>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {optional.map((b) => (
                        <Field key={b.id} orientation="horizontal">
                          <Checkbox
                            id={`warband-book-${b.id}`}
                            checked={field.value.includes(b.id)}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked ? [...field.value, b.id] : field.value.filter((id) => id !== b.id),
                              )
                            }
                          />
                          <FieldLabel htmlFor={`warband-book-${b.id}`} className="font-normal">
                            {sourceLabel(b)}
                          </FieldLabel>
                        </Field>
                      ))}
                    </div>
                  </FieldSet>
                )}
              />
            )}
            <Controller
              control={form.control}
              name="pointsCap"
              render={({ field, fieldState }) => {
                const custom = customChosen || !isGameSize(field.value)
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="warband-size">Game size</FieldLabel>
                    <Select
                      value={custom ? CUSTOM_SIZE : String(field.value)}
                      onValueChange={(v) => {
                        if (v === CUSTOM_SIZE) {
                          setCustomChosen(true)
                          return
                        }
                        setCustomChosen(false)
                        field.onChange(Number(v))
                      }}
                    >
                      <SelectTrigger id="warband-size" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gameSizeOptions.map((o) => (
                          <SelectItem key={o.points} value={String(o.points)}>
                            <span className="font-display text-base font-semibold tabular-nums">{o.points} pts</span>
                            <span className="text-muted-foreground">{o.label}</span>
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value={CUSTOM_SIZE}>Custom points cap</SelectItem>
                      </SelectContent>
                    </Select>
                    {custom && (
                      <>
                        <FieldLabel htmlFor="warband-cap" className="sr-only">
                          Points cap
                        </FieldLabel>
                        <Input
                          id="warband-cap"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          aria-label="Points cap"
                          aria-invalid={fieldState.invalid}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={Number.isNaN(field.value) ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </>
                    )}
                    <FieldDescription>No more than {edition.personalityShare} the points may go on Personalities.</FieldDescription>
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </Field>
                )
              }}
            />
            {hasRosters && (
              <>
                <Controller
                  control={form.control}
                  name="roster"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="warband-roster">Roster</FieldLabel>
                      <Select value={field.value || NO_ROSTER} onValueChange={(v) => field.onChange(v === NO_ROSTER ? '' : v)}>
                        <SelectTrigger id="warband-roster" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_ROSTER}>Not set</SelectItem>
                          <SelectSeparator />
                          <SelectItem value={MIXED_ROSTER}>Anything goes</SelectItem>
                          {usable
                            .filter((x) => rosterChoices.some((r) => r.sourceId === x.id))
                            .map((x) => (
                              <SelectGroup key={x.id}>
                                <SelectLabel>{sourceLabel(x)}</SelectLabel>
                                {rosterChoices
                                  .filter((r) => r.sourceId === x.id)
                                  .map((o) => (
                                    <SelectItem key={o.id} value={o.id}>
                                      {o.label}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>Stick to one roster, or pick Anything goes for a mixed warband.</FieldDescription>
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="strictRoster"
                  render={({ field }) => (
                    <Field orientation="horizontal" data-disabled={!canBeStrict}>
                      <Switch
                        id="warband-strict"
                        checked={canBeStrict && field.value}
                        disabled={!canBeStrict}
                        onCheckedChange={field.onChange}
                      />
                      <div className="flex flex-col gap-0.5">
                        <FieldLabel htmlFor="warband-strict">Strict roster</FieldLabel>
                        <FieldDescription>
                          {canBeStrict
                            ? 'Only models from this roster. Others are flagged, and the library offers only this roster.'
                            : 'Pick a single roster to use this.'}
                        </FieldDescription>
                      </div>
                    </Field>
                  )}
                />
              </>
            )}
            <Controller
              control={form.control}
              name="theme"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="warband-theme">Theme</FieldLabel>
                  <Input id="warband-theme" autoComplete="off" placeholder="Optional" aria-invalid={fieldState.invalid} {...field} />
                  <FieldDescription>A line about who they are, such as a faction or story.</FieldDescription>
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="warband-settings">
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
