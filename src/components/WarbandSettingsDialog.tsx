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
import type { WarbandSettings } from '@/stores/data-store'

const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Give the warband a name.').max(80, 'Keep the name under 80 characters.'),
  theme: z.string().max(120, 'Keep the theme under 120 characters.'),
  pointsCap: z
    .number({ error: 'Enter the points cap as a number.' })
    .int('Use a whole number.')
    .min(1, 'The points cap must be above zero.')
    .max(10000, 'The points cap must be 10000 or less.'),
})

type SettingsValues = z.infer<typeof settingsSchema>

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
    values: { name: initial.name, theme: initial.theme ?? '', pointsCap: initial.pointsCap },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Name the warband and set its points cap.</DialogDescription>
        </DialogHeader>
        <form
          id="warband-settings"
          noValidate
          onSubmit={form.handleSubmit((v) => onSubmit({ name: v.name, theme: v.theme.trim() || undefined, pointsCap: v.pointsCap }))}
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
            <Controller
              control={form.control}
              name="pointsCap"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="warband-cap">Points cap</FieldLabel>
                  <Input
                    id="warband-cap"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    aria-invalid={fieldState.invalid}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={Number.isNaN(field.value) ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
