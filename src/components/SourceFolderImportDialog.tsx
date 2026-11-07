import { useRef, useState } from 'react'
import { FileJson, FolderOpen, RefreshCw } from 'lucide-react'
import { SourceCheckList } from '@/components/SourceCheckList'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { checkSourceFiles, validSources, type SourceFileCheck } from '@/lib/source-check'
import type { Source } from '@/lib/schema'

interface SourceFolderImportDialogProps {
  open: boolean
  /** Your sources, to spot clashing ids and replacements. */
  existing: readonly Source[]
  onOpenChange: (open: boolean) => void
  onImport: (sources: Source[]) => void
}

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`

/** The path a picked file has inside its folder, else its name. */
const pathOf = (file: File) => file.webkitRelativePath || file.name

/**
 * Reads every JSON file in a folder, or several chosen files, checks each one,
 * and imports the valid sources together. Later files lose to earlier ones
 * when they use the same source, rule or roster ids.
 */
export function SourceFolderImportDialog({ open, existing, onOpenChange, onImport }: SourceFolderImportDialogProps) {
  const folderRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)
  const [checks, setChecks] = useState<SourceFileCheck[]>()
  const [reading, setReading] = useState(false)

  const read = async (list: FileList | null) => {
    const files = [...(list ?? [])].filter((f) => f.name.toLowerCase().endsWith('.json')).sort((a, b) => pathOf(a).localeCompare(pathOf(b)))
    setReading(true)
    const texts = await Promise.all(files.map(async (f) => ({ path: pathOf(f), text: await f.text() })))
    setChecks(checkSourceFiles(texts, existing))
    setReading(false)
  }

  const close = (next: boolean) => {
    if (!next) setChecks(undefined)
    onOpenChange(next)
  }

  const valid = validSources(checks ?? [])

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

          {checks && !reading && <SourceCheckList checks={checks} />}
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
