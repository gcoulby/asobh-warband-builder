import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_EDITION, editions } from '@/data/editions'

interface NewSourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, game: string) => void
}

/** Starts an empty custom source for your own rules and profiles. */
export function NewSourceDialog({ open, onOpenChange, onCreate }: NewSourceDialogProps) {
  const [name, setName] = useState('')
  const [game, setGame] = useState<string>(DEFAULT_EDITION)
  const close = (next: boolean) => {
    if (!next) {
      setName('')
      setGame(DEFAULT_EDITION)
    }
    onOpenChange(next)
  }
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New custom source</DialogTitle>
          <DialogDescription>A home for your own rules and profiles, such as house rules or a warband you made up.</DialogDescription>
        </DialogHeader>
        <form
          id="new-source"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            onCreate(name.trim(), game)
            close(false)
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-source-name">Name</FieldLabel>
              <Input id="new-source-name" value={name} autoComplete="off" maxLength={80} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-source-game">Game</FieldLabel>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger id="new-source-game" className="w-full">
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
              <FieldDescription>Warbands of this game can use the source.</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button type="submit" form="new-source" disabled={!name.trim()}>
            Create source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
