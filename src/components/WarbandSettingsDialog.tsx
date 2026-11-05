import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { gameSizeOptions, isGameSize, rosterOptions } from '@/data/warband-options'
import type { WarbandSettings } from '@/stores/data-store'

const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Give the warband a name.').max(80, 'Keep the name under 80 characters.'),
  theme: z.string().max(120, 'Keep the theme under 120 characters.'),
  roster: z.string(),
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
    values: { name: initial.name, theme: initial.theme ?? '', roster: initial.roster ?? '', pointsCap: initial.pointsCap },
  })
  const [customChosen, setCustomChosen] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next) setCustomChosen(false)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Name the warband, pick its game size and roster.</DialogDescription>
        </DialogHeader>
        <form
          id="warband-settings"
          noValidate
          onSubmit={form.handleSubmit((v) => {
            setCustomChosen(false)
            onSubmit({ name: v.name, theme: v.theme.trim() || undefined, roster: v.roster || undefined, pointsCap: v.pointsCap })
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
                    <FieldDescription>No more than half the points may go on Personalities.</FieldDescription>
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </Field>
                )
              }}
            />
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
