import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { FileArchive, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { CreditsFooter } from '@/components/CreditsFooter'
import { EmptyState } from '@/components/EmptyState'
import { WarbandListItem } from '@/components/WarbandListItem'
import { WarbandSettingsDialog } from '@/components/WarbandSettingsDialog'
import { Button } from '@/components/ui/button'
import { DEFAULT_POINTS_CAP } from '@/data/profile-options'
import { editionTag } from '@/lib/editions'
import { rosterLabel } from '@/lib/sources'
import { useImageUrls } from '@/hooks/use-image-urls'
import { useWarbandFiles } from '@/hooks/use-warband-files'
import { warbandTotals } from '@/lib/cost'
import { useDataStore } from '@/stores/data-store'

export function HomePage() {
  const navigate = useNavigate()
  const warbands = useDataStore((s) => s.warbands)
  const models = useDataStore((s) => s.models)
  const rules = useDataStore((s) => s.rules)
  const profiles = useDataStore((s) => s.profiles)
  const rosters = useDataStore((s) => s.rosters)
  const sources = useDataStore((s) => s.sources)
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
          totals: warbandTotals(warband, models, rules, profiles),
          thumbnails: warband.entries.flatMap((e) => {
            const model = models.find((m) => m.id === e.modelId)
            return model
              ? [{ id: model.id, name: model.name, imageUrl: model.imageId ? imageUrls.get(model.imageId) : undefined }]
              : []
          }),
        })),
    [warbands, models, rules, profiles, imageUrls],
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
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[1.75rem] leading-none font-bold">Warbands</h1>
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
          title="No sources added yet."
          action={
            <Button asChild>
              <Link to="/sources">Add sources</Link>
            </Button>
          }
        >
          Sources are the books your special rules and ready-made profiles come from. Add the included ones, import
          a source file, or make your own.
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
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Saved warbands">
          {items.map(({ warband, totals, thumbnails }) => (
            <WarbandListItem
              key={warband.id}
              id={warband.id}
              name={warband.name}
              theme={warband.theme}
              roster={[editionTag(warband), rosterLabel(warband.roster, rosters)].filter(Boolean).join(' · ') || undefined}
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
        sources={sources}
        rosters={rosters}
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
      <CreditsFooter className="mt-6" />
    </main>
  )
}
