import { useRef, useState } from 'react'
import { CircleAlert, CircleCheck, FileJson, FolderOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { idClashes, readSourceText } from '@/lib/sources'
import type { Source } from '@/lib/schema'

interface SourceFolderImportDialogProps {
  open: boolean
  /** Your sources, to spot clashing ids and replacements. */
  existing: readonly Source[]
  onOpenChange: (open: boolean) => void
  onImport: (sources: Source[]) => void
}

/** What reading one file gave. */
interface FileCheck {
  path: string
  source?: Source
  /** True when the source replaces one you already have. */
  replaces?: boolean
  skipped?: number
  problem?: string
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`

/** The path a picked file has inside its folder, else its name. */
const pathOf = (file: File) => file.webkitRelativePath || file.name

/**
 * Reads every JSON file in a folder, or several chosen files, checks each one,
 * and imports the valid sources together. Later files lose to earlier ones
 * when they use the same rule or roster ids.
 */
export function SourceFolderImportDialog({ open, existing, onOpenChange, onImport }: SourceFolderImportDialogProps) {
  const folderRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)
  const [checks, setChecks] = useState<FileCheck[]>()
  const [reading, setReading] = useState(false)

  const read = async (list: FileList | null) => {
    const files = [...(list ?? [])].filter((f) => f.name.toLowerCase().endsWith('.json')).sort((a, b) => pathOf(a).localeCompare(pathOf(b)))
    setReading(true)
    const accepted: Source[] = [...existing]
    const seenIds = new Set<string>()
    const results: FileCheck[] = []
    for (const file of files) {
      const path = pathOf(file)
      const result = readSourceText(await file.text(), file.name.replace(/\.json$/i, ''))
      if (!result.ok) {
        results.push({ path, problem: result.error })
        continue
      }
      const { source } = result
      if (seenIds.has(source.id)) {
        results.push({ path, problem: `Another file in this folder is also source "${source.id}".` })
        continue
      }
      const clashes = idClashes(source, accepted)
      if (clashes.length > 0) {
        results.push({ path, problem: `Uses ids another source has: ${clashes.slice(0, 3).join(', ')}${clashes.length > 3 ? '…' : ''}.` })
        continue
      }
      if (source.rules.length + source.profiles.length === 0) {
        results.push({ path, problem: 'Holds no rules or profiles.' })
        continue
      }
      seenIds.add(source.id)
      const replaces = existing.some((s) => s.id === source.id)
      const index = accepted.findIndex((s) => s.id === source.id)
      if (index >= 0) accepted[index] = source
      else accepted.push(source)
      results.push({ path, source, replaces, skipped: result.errors.length })
    }
    setChecks(results)
    setReading(false)
  }

  const close = (next: boolean) => {
    if (!next) setChecks(undefined)
    onOpenChange(next)
  }

  const valid = (checks ?? []).flatMap((c) => (c.source ? [c.source] : []))

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import a folder of sources</DialogTitle>
          <DialogDescription>
            Choose a folder and every JSON file in it, and in its subfolders, is checked. Valid sources are imported
            together. Nothing leaves your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 flex min-h-0 flex-col gap-3 overflow-y-auto px-4 py-1">
          <input
            ref={folderRef}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="source-folder-input"
            {...{ webkitdirectory: '', directory: '' }}
            multiple
            onChange={(e) => {
              void read(e.target.files)
              e.target.value = ''
            }}
          />
          <input
            ref={filesRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="source-files-input"
            multiple
            onChange={(e) => {
              void read(e.target.files)
              e.target.value = ''
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant={checks ? 'outline' : 'default'} onClick={() => folderRef.current?.click()} disabled={reading}>
              {checks ? <RefreshCw /> : <FolderOpen />} {checks ? 'Choose another folder' : 'Choose folder'}
            </Button>
            <Button variant="outline" onClick={() => filesRef.current?.click()} disabled={reading}>
              <FileJson /> Choose files
            </Button>
          </div>

          {reading && (
            <p className="text-sm text-muted-foreground" role="status">
              Reading files…
            </p>
          )}

          {checks && !reading && (
            <div className="flex flex-col gap-2" aria-live="polite">
              <p className="font-semibold">
                {checks.length === 0
                  ? 'No JSON files found there.'
                  : `${plural(valid.length, 'source')} ready to import, ${plural(checks.length - valid.length, 'file')} skipped.`}
              </p>
              <ul className="flex flex-col divide-y rounded-sm border bg-card">
                {checks.map((c) => (
                  <li key={c.path} className="flex items-start gap-2 px-3 py-2 text-sm">
                    {c.source ? (
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Valid" />
                    ) : (
                      <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Skipped" />
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-mono text-xs text-muted-foreground">{c.path}</span>
                      {c.source ? (
                        <span>
                          <span className="font-semibold">{c.source.name}</span>: {plural(c.source.rules.length, 'rule')},{' '}
                          {plural(c.source.profiles.length, 'profile')}
                          {c.replaces && ', replaces your copy'}
                          {c.skipped ? `, ${plural(c.skipped, 'bad entry')} left out` : ''}.
                        </span>
                      ) : (
                        <span className="text-destructive">{c.problem}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button disabled={valid.length === 0} onClick={() => onImport(valid)}>
            {valid.length > 0 ? `Import ${plural(valid.length, 'source')}` : 'Import sources'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
