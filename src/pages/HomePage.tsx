import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { FileArchive, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { WarbandListItem } from '@/components/WarbandListItem'
import { WarbandSettingsDialog } from '@/components/WarbandSettingsDialog'
import { Button } from '@/components/ui/button'
import { DEFAULT_POINTS_CAP } from '@/data/profile-options'
import { useImageUrls } from '@/hooks/use-image-urls'
import { useWarbandFiles } from '@/hooks/use-warband-files'
import { warbandTotals } from '@/lib/cost'
import { useDataStore } from '@/stores/data-store'

export function HomePage() {
  const navigate = useNavigate()
  const warbands = useDataStore((s) => s.warbands)
  const models = useDataStore((s) => s.models)
  const rules = useDataStore((s) => s.rules)
  const createWarband = useDataStore((s) => s.createWarband)
  const files = useWarbandFiles()
  const [createOpen, setCreateOpen] = useState(false)

  const imageUrls = useImageUrls(useMemo(() => models.map((m) => m.imageId), [models]))

  const items = useMemo(
    () =>
      [...warbands]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((warband) => ({
          warband,
          totals: warbandTotals(warband, models, rules),
          thumbnails: warband.entries.flatMap((e) => {
            const model = models.find((m) => m.id === e.modelId)
            return model
              ? [{ id: model.id, name: model.name, imageUrl: model.imageId ? imageUrls.get(model.imageId) : undefined }]
              : []
          }),
        })),
    [warbands, models, rules, imageUrls],
  )

  const handleImport = () => {
    files
      .importZip()
      .then((result) => {
        if (!result) return
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Warband imported')
        void navigate(`/warband/${result.value}`)
      })
      .catch(() => toast.error('The file could not be opened. Try again.'))
  }

  const noRules = rules.length === 0

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[2rem] leading-none font-bold">Warbands</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <FileArchive /> Import warband
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New warband
          </Button>
        </div>
      </div>

      {noRules && (
        <EmptyState
          title="No rules loaded yet."
          action={
            <Button asChild>
              <Link to="/rules">Import rules</Link>
            </Button>
          }
        >
          Import the special rules so you can give them to your models. The rules screen offers the included
          rules file, or you can load your own.
        </EmptyState>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No warbands yet. Create your first warband."
          action={
            <Button variant={noRules ? 'outline' : 'default'} onClick={() => setCreateOpen(true)}>
              <Plus /> New warband
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Saved warbands">
          {items.map(({ warband, totals, thumbnails }) => (
            <WarbandListItem
              key={warband.id}
              id={warband.id}
              name={warband.name}
              theme={warband.theme}
              total={totals.total}
              cap={warband.pointsCap}
              hasUnknown={totals.hasUnknown}
              modelCount={totals.modelCount}
              thumbnails={thumbnails}
            />
          ))}
        </ul>
      )}

      <WarbandSettingsDialog
        open={createOpen}
        title="New warband"
        submitLabel="Create warband"
        initial={{ name: '', pointsCap: DEFAULT_POINTS_CAP }}
        onOpenChange={setCreateOpen}
        onSubmit={(settings) => {
          const id = createWarband(settings)
          setCreateOpen(false)
          toast.success('Warband created')
          void navigate(`/warband/${id}`)
        }}
      />
    </main>
  )
}
