import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Model, Roster } from '@/lib/schema'

interface ProfileFromModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  models: readonly Model[]
  /** Rosters already in the source. */
  rosters: readonly Roster[]
  /** Saves the model as a profile in the chosen roster, or in a new roster with this name. */
  onSave: (model: Model, roster: { id: string } | { newLabel: string }) => void
}

const NEW_ROSTER = '__new'

/** Saves one of your library models as a ready-made profile in a source. */
export function ProfileFromModelDialog({ open, onOpenChange, models, rosters, onSave }: ProfileFromModelDialogProps) {
  const [modelId, setModelId] = useState<string>()
  const [rosterId, setRosterId] = useState<string>(rosters[0]?.id ?? NEW_ROSTER)
  const [newLabel, setNewLabel] = useState('')
  const model = models.find((m) => m.id === modelId)
  const isNew = rosterId === NEW_ROSTER
  const valid = Boolean(model) && (!isNew || newLabel.trim() !== '')

  const close = (next: boolean) => {
    if (!next) {
      setModelId(undefined)
      setNewLabel('')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a profile</DialogTitle>
          <DialogDescription>Copies a model from your library, with its stats and rules, into this source.</DialogDescription>
        </DialogHeader>
        <form
          id="profile-from-model"
          onSubmit={(e) => {
            e.preventDefault()
            if (!model) return
            onSave(model, isNew ? { newLabel: newLabel.trim() } : { id: rosterId })
            close(false)
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-model">Model</FieldLabel>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger id="profile-model" className="w-full">
                  <SelectValue placeholder={models.length ? 'Choose a model' : 'Your library is empty'} />
                </SelectTrigger>
                <SelectContent>
                  {[...models]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-roster">Roster</FieldLabel>
              <Select value={rosterId} onValueChange={setRosterId}>
                <SelectTrigger id="profile-roster" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rosters.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                  {rosters.length > 0 && <SelectSeparator />}
                  <SelectItem value={NEW_ROSTER}>New roster…</SelectItem>
                </SelectContent>
              </Select>
              {isNew && (
                <>
                  <FieldLabel htmlFor="profile-new-roster" className="sr-only">
                    New roster name
                  </FieldLabel>
                  <Input
                    id="profile-new-roster"
                    value={newLabel}
                    placeholder="Roster name, such as Bandits"
                    autoComplete="off"
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </>
              )}
              <FieldDescription>Profiles are offered by roster in the builder's library.</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button type="submit" form="profile-from-model" disabled={!valid}>
            Add profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
