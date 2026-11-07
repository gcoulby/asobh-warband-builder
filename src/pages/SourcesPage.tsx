import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { FileJson, FolderOpen, Library, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { BookUpdateNotice } from '@/components/BookUpdateNotice'
import { BundledSourcesDialog } from '@/components/BundledSourcesDialog'
import { CreditsFooter } from '@/components/CreditsFooter'
import { EmptyState } from '@/components/EmptyState'
import { NewSourceDialog } from '@/components/NewSourceDialog'
import { SourceFormatInfo } from '@/components/SourceFormatInfo'
import { SourceFolderImportDialog } from '@/components/SourceFolderImportDialog'
import { SourceImportDialog } from '@/components/SourceImportDialog'
import { SourceListItem } from '@/components/SourceListItem'
import { Button } from '@/components/ui/button'
import { editions } from '@/data/editions'
import { freeId, idClashes, newCustomSource } from '@/lib/sources'
import { bundledSources } from '@/lib/sources-loader'
import type { Source } from '@/lib/schema'
import { useDataStore } from '@/stores/data-store'

/** The source manager: every book, supplement and custom source you have, and ways to add more. */
export function SourcesPage() {
  const navigate = useNavigate()
  const sources = useDataStore((s) => s.sources)
  const saveSource = useDataStore((s) => s.saveSource)
  const bundled = useMemo(() => bundledSources(), [])
  const [catalogueOpen, setCatalogueOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)

  const add = (source: Source) => {
    const clashes = idClashes(source, sources)
    if (clashes.length > 0) {
      toast.error(`${source.name} uses ids another source already has: ${clashes.slice(0, 3).join(', ')}.`)
      return
    }
    saveSource(source)
    toast.success(`${source.name} added`)
  }

  const byGame = editions
    .map((e) => ({ edition: e, sources: sources.filter((s) => s.game === e.id) }))
    .filter((g) => g.sources.length > 0)
  const otherGames = sources.filter((s) => !editions.some((e) => e.id === s.game))

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] leading-none font-bold">Sources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Books, supplements and your own collections. Each holds its own rules and ready-made profiles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setNewOpen(true)}>
            <Plus /> New custom source
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileJson /> Import source file
          </Button>
          <Button variant="outline" onClick={() => setFolderOpen(true)}>
            <FolderOpen /> Import folder
          </Button>
          <Button onClick={() => setCatalogueOpen(true)}>
            <Library /> Add included sources
          </Button>
        </div>
      </div>

      <BookUpdateNotice />

      {sources.length === 0 ? (
        <EmptyState
          title="No sources yet."
          action={
            <Button onClick={() => setCatalogueOpen(true)}>
              <Library /> Add included sources
            </Button>
          }
        >
          Start with the included rulebooks and supplements, import a source file someone shared, or make your own.
        </EmptyState>
      ) : (
        <>
          {byGame.map(({ edition, sources: list }) => (
            <section key={edition.id} aria-labelledby={`sources-${edition.id}`} className="flex flex-col gap-2">
              <h2 id={`sources-${edition.id}`} className="font-display text-xl font-semibold">
                {edition.label}
              </h2>
              <ul className="flex flex-col gap-2">
                {[...list]
                  .sort((a, b) => (a.kind === 'core' ? -1 : b.kind === 'core' ? 1 : a.name.localeCompare(b.name)))
                  .map((source) => (
                    <SourceListItem key={source.id} source={source} />
                  ))}
              </ul>
            </section>
          ))}
          {otherGames.length > 0 && (
            <section aria-labelledby="sources-other" className="flex flex-col gap-2">
              <h2 id="sources-other" className="font-display text-xl font-semibold">
                Other games
              </h2>
              <ul className="flex flex-col gap-2">
                {otherGames.map((source) => (
                  <SourceListItem key={source.id} source={source} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <BundledSourcesDialog
        open={catalogueOpen}
        onOpenChange={setCatalogueOpen}
        bundled={bundled}
        added={sources}
        onAdd={add}
      />
      <SourceImportDialog
        open={importOpen}
        existing={sources}
        onOpenChange={setImportOpen}
        onImport={(source) => {
          saveSource(source)
          setImportOpen(false)
          toast.success(`${source.name} imported`)
          void navigate(`/sources/${encodeURIComponent(source.id)}`)
        }}
      />
      <SourceFolderImportDialog
        open={folderOpen}
        existing={sources}
        onOpenChange={setFolderOpen}
        onImport={(list) => {
          list.forEach(saveSource)
          setFolderOpen(false)
          toast.success(`${list.length} ${list.length === 1 ? 'source' : 'sources'} imported`)
        }}
      />
      <NewSourceDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={(name, game) => {
          const id = freeId(name, new Set(sources.map((s) => s.id)), 'custom-')
          saveSource(newCustomSource(id, name, game))
          void navigate(`/sources/${encodeURIComponent(id)}`)
        }}
      />
      <SourceFormatInfo />
      <CreditsFooter className="mt-6" />
    </main>
  )
}
