import { useRef, useState } from 'react'
import { CircleAlert, FileJson } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { idClashes, readSourceText, type SourceReadResult } from '@/lib/sources'
import type { Source } from '@/lib/schema'

interface SourceImportDialogProps {
  open: boolean
  /** Sources you already have, to spot clashing ids and replacements. */
  existing: readonly Source[]
  onOpenChange: (open: boolean) => void
  onImport: (source: Source) => void
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`

/** Reads a source file, or an older rules file, and shows what it holds before adding it. */
export function SourceImportDialog({ open, existing, onOpenChange, onImport }: SourceImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string>()
  const [result, setResult] = useState<SourceReadResult>()

  const check = (value: string, name?: string) => {
    setText(value)
    setResult(value.trim() ? readSourceText(value, name?.replace(/\.json$/i, '')) : undefined)
  }

  const close = (next: boolean) => {
    if (!next) {
      setText('')
      setFileName(undefined)
      setResult(undefined)
    }
    onOpenChange(next)
  }

  const source = result?.ok ? result.source : undefined
  const clashes = source ? idClashes(source, existing) : []
  const replaces = source && existing.find((s) => s.id === source.id)
  const importable = source && clashes.length === 0 && source.rules.length + source.profiles.length > 0 ? source : undefined

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import a source</DialogTitle>
          <DialogDescription>
            Choose a source file, or paste its contents. A plain rules file becomes a custom source.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 flex min-h-0 flex-col gap-4 overflow-y-auto px-4 py-1">
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="source-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setFileName(file.name)
              void file.text().then((t) => check(t, file.name))
            }}
          />
          <Button variant="outline" className="self-start" onClick={() => inputRef.current?.click()}>
            <FileJson /> Choose file
          </Button>
          {fileName && <p className="-mt-2 text-sm text-muted-foreground">{fileName}</p>}

          <Field>
            <FieldLabel htmlFor="source-json">Or paste JSON</FieldLabel>
            <Textarea
              id="source-json"
              rows={4}
              value={text}
              onChange={(e) => check(e.target.value)}
              className="max-h-40 font-mono text-xs"
              spellCheck={false}
            />
            <FieldDescription>Download any source to see the expected shape.</FieldDescription>
          </Field>

          {result && !result.ok && (
            <Alert variant="destructive" className="bg-card">
              <CircleAlert aria-hidden="true" />
              <AlertTitle>This file cannot be imported</AlertTitle>
              <AlertDescription className="text-foreground">{result.error}</AlertDescription>
            </Alert>
          )}

          {result?.ok && source && (
            <div className="flex flex-col gap-3" aria-live="polite">
              <p>
                <span className="font-bold">{source.name}</span>: {plural(source.rules.length, 'rule')},{' '}
                {plural(source.rosters.length, 'roster')} and {plural(source.profiles.length, 'profile')}.
                {replaces && ' It replaces the source with the same id that you already have.'}
              </p>
              {clashes.length > 0 && (
                <Alert variant="destructive" className="bg-card">
                  <CircleAlert aria-hidden="true" />
                  <AlertTitle>Ids already used by another source</AlertTitle>
                  <AlertDescription className="text-foreground">
                    <ul className="mt-1 flex max-h-40 flex-col gap-1 overflow-y-auto">
                      {clashes.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                    <p className="mt-2">Give these entries new ids in the file, or delete the other source first.</p>
                  </AlertDescription>
                </Alert>
              )}
              {result.errors.length > 0 && (
                <Alert variant="destructive" className="bg-card">
                  <CircleAlert aria-hidden="true" />
                  <AlertTitle>{plural(result.errors.length, 'entry')} will be skipped</AlertTitle>
                  <AlertDescription className="text-foreground">
                    <ul className="mt-1 flex max-h-40 flex-col gap-1 overflow-y-auto">
                      {result.errors.map((e) => (
                        <li key={`${e.list}-${e.position}`}>
                          <span className="font-bold">
                            {e.list} entry {e.position}
                            {e.id && ` (${e.id})`}:
                          </span>{' '}
                          {e.messages.join('; ')}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button disabled={!importable} onClick={() => importable && onImport(importable)}>
            {replaces ? 'Replace source' : 'Import source'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
