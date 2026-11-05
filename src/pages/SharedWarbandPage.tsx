import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CircleAlert, ImageOff, Save } from 'lucide-react'
import { toast } from 'sonner'
import { CreditsFooter } from '@/components/CreditsFooter'
import { rosterLabel } from '@/data/warband-options'
import { ModelCard } from '@/components/ModelCard'
import { PointsBar } from '@/components/PointsBar'
import { ValidationPanel } from '@/components/ValidationPanel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useRoster } from '@/hooks/use-roster'
import { decodeShare } from '@/lib/share'
import { useDataStore } from '@/stores/data-store'

const noImages: ReadonlyMap<string, string> = new Map()

export function SharedWarbandPage() {
  const { payload = '' } = useParams()
  const navigate = useNavigate()
  const importBundle = useDataStore((s) => s.importBundle)
  const decoded = useMemo(() => decodeShare(payload), [payload])
  const bundle = decoded.ok ? decoded.value : undefined
  const view = useRoster(bundle?.warband, bundle?.models ?? [], bundle?.rules ?? [], noImages)

  if (!decoded.ok || !bundle || !view) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <Alert variant="destructive" className="bg-card">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>This share link cannot be opened</AlertTitle>
          <AlertDescription className="text-foreground">
            <p>{decoded.ok ? 'The link holds no warband.' : decoded.error}</p>
            <Button asChild variant="outline" className="mt-3">
              <Link to="/">Go to warbands</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  const { warband } = bundle

  return (
    <>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4 pb-32">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Shared warband, read only</p>
            <h1 className="font-display text-[1.5rem] leading-tight font-bold wrap-break-word">{warband.name}</h1>
            {(warband.roster || warband.theme) && (
              <p className="text-muted-foreground">{[rosterLabel(warband.roster), warband.theme].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <Button
            onClick={() => {
              const id = importBundle(bundle)
              toast.success('Copy saved')
              void navigate(`/warband/${id}`)
            }}
          >
            <Save /> Save a copy
          </Button>
        </div>

        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageOff className="size-4 shrink-0" aria-hidden="true" />
          Pictures are not included in share links, so models show placeholders.
        </p>

        <ValidationPanel messages={view.messages} />

        <ol className="flex flex-col gap-3" aria-label="Roster">
          {view.rows.map((row) => (
            <li key={row.entry.modelId}>
              <ModelCard
                variant="roster"
                model={row.model}
                rules={bundle.rules}
                cost={row.cost}
                quantity={row.entry.quantity}
              />
            </li>
          ))}
        </ol>
        <CreditsFooter className="mt-6" />
      </main>
      <PointsBar
        total={view.totals.total}
        cap={warband.pointsCap}
        hasUnknown={view.totals.hasUnknown}
        modelCount={view.totals.modelCount}
        groupCount={view.totals.groupCount}
        className="fixed inset-x-0 bottom-0 z-30 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      />
    </>
  )
}
