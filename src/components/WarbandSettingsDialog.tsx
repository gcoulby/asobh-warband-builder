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
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_EDITION, editions, supplements as allSupplements } from '@/data/editions'
import { gameSizeOptions, isGameSize, MIXED_ROSTER, rosterOptions } from '@/data/warband-options'
import { editionById, editionIdOf, isEditionId } from '@/lib/editions'
import type { WarbandSettings } from '@/stores/data-store'

const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Give the warband a name.').max(80, 'Keep the name under 80 characters.'),
  theme: z.string().max(120, 'Keep the theme under 120 characters.'),
  edition: z.string(),
  books: z.array(z.string()),
  roster: z.string(),
  strictRoster: z.boolean(),
  pointsCap: z
    .number({ error: 'Enter the points cap as a number.' })
    .int('Use a whole number.')
    .min(1, 'The points cap must be above zero.')
    .max(10000, 'The points cap must be 10000 or less.'),
})

type SettingsValues = z.infer<typeof settingsSchema>

/** Without a saved choice every supplement is ticked, whichever game is picked. */
const allSupplementIds = allSupplements.map((b) => b.id)

/** Select values that stand for "no roster" and "a points cap not in the list". */
const NO_ROSTER = 'none'
const CUSTOM_SIZE = 'custom'

interface WarbandSettingsDialogProps {
  open: boolean
  title: string
  submitLabel: string
  initial: WarbandSettings
  onOpenChange: (open: boolean) => void
  onSubmit: (settings: WarbandSettings) => void
}

export function WarbandSettingsDialog({ open, title, submitLabel, initial, onOpenChange, onSubmit }: WarbandSettingsDialogProps) {
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      name: initial.name,
      edition: editionIdOf(initial),
      books: initial.books ?? allSupplementIds,
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
  const supplements = edition.books.filter((b) => !b.core)
  const canBeStrict = edition.hasRosters && Boolean(roster) && roster !== MIXED_ROSTER

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
              books: supplements.length > 0 ? supplements.filter((b) => v.books.includes(b.id)).map((b) => b.id) : undefined,
              roster: edition.hasRosters ? v.roster || undefined : undefined,
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
            {supplements.length > 0 && (
              <Controller
                control={form.control}
                name="books"
                render={({ field }) => (
                  <FieldSet>
                    <FieldLegend variant="label">Supplements</FieldLegend>
                    <FieldDescription>
                      {edition.books.some((b) => b.core)
                        ? 'The core book is always in use. Rules from books left out are flagged.'
                        : `Adds their rules. Where ${edition.shortLabel} has a rule of the same name, its own version is used.`}
                    </FieldDescription>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {supplements.map((b) => (
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
                            {b.label}
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
            {edition.hasRosters && (
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
                          {rosterOptions.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.label}
                            </SelectItem>
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
