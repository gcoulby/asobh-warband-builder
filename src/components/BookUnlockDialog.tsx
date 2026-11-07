import { useState } from 'react'
import { SourceCheckList } from '@/components/SourceCheckList'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { BookUnlockError, openBook, sealedDate, type SealedBook } from '@/lib/sealed-book'
import { checkSourceFiles, validSources, type SourceFileCheck } from '@/lib/source-check'
import type { Source } from '@/lib/schema'

interface BookUnlockDialogProps {
  open: boolean
  book: SealedBook
  /** Your sources, to spot clashing ids and replacements. */
  existing: readonly Source[]
  onOpenChange: (open: boolean) => void
  onImport: (sources: Source[]) => void
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`

/** Asks for the passphrase, opens the sealed book in the browser, and imports its sources. */
export function BookUnlockDialog({ open, book, existing, onOpenChange, onImport }: BookUnlockDialogProps) {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [checks, setChecks] = useState<SourceFileCheck[]>()

  const close = (next: boolean) => {
    if (!next) {
      setPassphrase('')
      setError(undefined)
      setChecks(undefined)
    }
    onOpenChange(next)
  }

  const unlock = async () => {
    setBusy(true)
    setError(undefined)
    try {
      const files = await openBook(book, passphrase)
      setChecks(checkSourceFiles(files.map((f) => ({ path: f.name, text: f.text })), existing))
      setPassphrase('')
    } catch (e) {
      setError(e instanceof BookUnlockError ? e.message : 'The book data could not be read. Try again later.')
    } finally {
      setBusy(false)
    }
  }

  const valid = validSources(checks ?? [])
  const replacing = (checks ?? []).filter((c) => c.replaces).length

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Unlock book data</DialogTitle>
          <DialogDescription>
            Sealed {sealedDate(book)}, {plural(book.fileCount, 'source file')}. It is opened in your browser with your
            passphrase, which is never sent or stored.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 flex min-h-0 flex-col gap-3 overflow-y-auto px-4 py-1">
          {checks ? (
            <>
              <SourceCheckList checks={checks} emptyText="The book holds no source files." />
              {replacing > 0 && (
                <p className="text-sm text-muted-foreground">
                  {plural(replacing, 'source')} you already have will be replaced, edits included. Download a source
                  first if you want to keep your changes.
                </p>
              )}
            </>
          ) : (
            <form
              id="book-unlock"
              onSubmit={(e) => {
                e.preventDefault()
                if (passphrase && !busy) void unlock()
              }}
            >
              {/* Lets password managers file the passphrase under one name. */}
              <input type="text" name="username" autoComplete="username" value="book-data" readOnly hidden />
              <FieldGroup>
                <Field data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor="book-passphrase">Passphrase</FieldLabel>
                  <Input
                    id="book-passphrase"
                    type="password"
                    autoComplete="current-password"
                    value={passphrase}
                    aria-invalid={error ? true : undefined}
                    onChange={(e) => setPassphrase(e.target.value)}
                  />
                  {error ? (
                    <FieldError>{error}</FieldError>
                  ) : (
                    <FieldDescription>Unlocking takes a second or two while the key is worked out.</FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            </form>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          {checks ? (
            <Button disabled={valid.length === 0} onClick={() => onImport(valid)}>
              {valid.length > 0 ? `Import ${plural(valid.length, 'source')}` : 'Import sources'}
            </Button>
          ) : (
            <Button type="submit" form="book-unlock" disabled={!passphrase || busy}>
              {busy ? 'Unlocking…' : 'Unlock'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
