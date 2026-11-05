import { useRef, useState } from 'react'
import { CircleAlert, FileJson } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { parseRulesText, type RulesLoadResult } from '@/lib/rules-loader'

interface RulesImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (result: Extract<RulesLoadResult, { ok: true }>) => void
}

export function RulesImportDialog({ open, onOpenChange, onImport }: RulesImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState<RulesLoadResult>()

  const check = (value: string) => {
    setText(value)
    setResult(value.trim() ? parseRulesText(value) : undefined)
  }

  const close = (next: boolean) => {
    if (!next) {
      setText('')
      setResult(undefined)
    }
    onOpenChange(next)
  }

  const importable = result?.ok && result.rules.length > 0 ? result : undefined

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import rules</DialogTitle>
          <DialogDescription>
            Choose a rules JSON file, or paste its contents. Rules with the same id as ones you have are replaced.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="rules-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            void file.text().then(check)
          }}
        />
        <Button variant="outline" className="self-start" onClick={() => inputRef.current?.click()}>
          <FileJson /> Choose rules file
        </Button>

        <Field>
          <FieldLabel htmlFor="rules-json">Or paste JSON</FieldLabel>
          <Textarea
            id="rules-json"
            rows={5}
            value={text}
            onChange={(e) => check(e.target.value)}
            className="max-h-48 font-mono text-xs"
            spellCheck={false}
          />
          <FieldDescription>Download the template on the Rules screen to see the expected shape.</FieldDescription>
        </Field>

        {result && !result.ok && (
          <Alert variant="destructive" className="bg-card">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>This file cannot be imported</AlertTitle>
            <AlertDescription className="text-foreground">{result.error}</AlertDescription>
          </Alert>
        )}

        {result?.ok && (
          <div className="flex flex-col gap-3" aria-live="polite">
            <p>
              <span className="font-bold">
                {result.rules.length} {result.rules.length === 1 ? 'rule' : 'rules'} ready to import
              </span>
              {result.name && ` from ${result.name}`}.
            </p>
            {result.errors.length > 0 && (
              <Alert variant="destructive" className="bg-card">
                <CircleAlert aria-hidden="true" />
                <AlertTitle>
                  {result.errors.length} {result.errors.length === 1 ? 'entry' : 'entries'} will be skipped
                </AlertTitle>
                <AlertDescription className="text-foreground">
                  <ul className="mt-1 flex max-h-48 flex-col gap-1 overflow-y-auto">
                    {result.errors.map((e) => (
                      <li key={e.position}>
                        <span className="font-bold">
                          Entry {e.position}
                          {e.id && ` (${e.id})`}:
                        </span>{' '}
                        {e.messages.join('; ')}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">Fix these in the file and import again, or import the valid entries now.</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button disabled={!importable} onClick={() => importable && onImport(importable)}>
            {importable && importable.errors.length > 0 ? 'Import valid rules' : 'Import rules'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
