import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft, Library, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EditorSheet } from '@/components/EditorSheet'
import { EmptyState } from '@/components/EmptyState'
import { LibraryPickerDialog, type LibraryPickerItem } from '@/components/LibraryPickerDialog'
import { PointsBar } from '@/components/PointsBar'
import { Roster } from '@/components/Roster'
import { ShareDialog } from '@/components/ShareDialog'
import { ValidationPanel } from '@/components/ValidationPanel'
import { WarbandMenu } from '@/components/WarbandMenu'
import { WarbandSettingsDialog } from '@/components/WarbandSettingsDialog'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ModelEditorContainer, type EditTarget } from '@/containers/ModelEditorContainer'
import { useImageUrls } from '@/hooks/use-image-urls'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { usePrefs } from '@/hooks/use-prefs'
import { useRoster } from '@/hooks/use-roster'
import { useWarbandFiles } from '@/hooks/use-warband-files'
import { bundleWarband } from '@/lib/bundle'
import { modelCost } from '@/lib/cost'
import { shareUrl } from '@/lib/share'
import { selectStoredData, useDataStore } from '@/stores/data-store'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function WarbandPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [, setPrefs] = usePrefs()

  const warband = useDataStore((s) => s.warbands.find((w) => w.id === id))
  const models = useDataStore((s) => s.models)
  const rules = useDataStore((s) => s.rules)
  const actions = useDataStore.getState()

  const imageUrls = useImageUrls(useMemo(() => models.map((m) => m.imageId), [models]))
  const view = useRoster(warband, models, rules, imageUrls)
  const files = useWarbandFiles()

  const [editing, setEditing] = useState<EditTarget>()
  const [newModelId, setNewModelId] = useState<string>()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (warband) setPrefs({ lastWarbandId: warband.id })
  }, [warband?.id, setPrefs, warband])

  const pickerItems = useMemo<LibraryPickerItem[]>(
    () =>
      models.map((model) => ({
        model,
        cost: modelCost(model, rules),
        imageUrl: model.imageId ? imageUrls.get(model.imageId) : undefined,
        ruleNames: model.ruleIds.map((rid) => rules.find((r) => r.id === rid)?.name ?? rid),
      })),
    [models, rules, imageUrls],
  )

  if (!warband || !view) return <NotFoundPage what="warband" />

  const editTitle = editing?.kind === 'new' ? 'Add model' : 'Edit model'
  const selectedModelId = editing?.kind === 'existing' ? editing.modelId : undefined

  const openEditor = (target: EditTarget) => {
    setEditing(target)
    if (target.kind === 'existing') setPrefs({ lastModelId: target.modelId })
  }

  const handleDone = (savedId?: string) => {
    if (savedId && editing?.kind === 'new') setNewModelId(savedId)
    setEditing(isDesktop && savedId ? { kind: 'existing', modelId: savedId } : undefined)
  }

  const share = shareOpen
    ? shareUrl(bundleWarband(warband, selectStoredData(useDataStore.getState())), window.location.origin, import.meta.env.BASE_URL)
    : ''

  const editor = editing && (
    <ModelEditorContainer
      key={editing.kind === 'existing' ? editing.modelId : 'new'}
      target={editing}
      warbandId={warband.id}
      onDone={handleDone}
    />
  )

  const rosterColumn = (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4 pb-6">
      <div className="flex items-start gap-1">
        <Button asChild variant="ghost" size="icon" className="-ml-2 shrink-0">
          <Link to="/" aria-label="Back to warbands">
            <ChevronLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="font-display text-[1.75rem] leading-tight font-bold wrap-break-word">{warband.name}</h1>
          {warband.theme && <p className="text-muted-foreground">{warband.theme}</p>}
        </div>
        <WarbandMenu
          onSettings={() => setSettingsOpen(true)}
          onShare={() => setShareOpen(true)}
          onPrint={() => void navigate(`/print/${warband.id}`)}
          onExportZip={() => {
            files
              .exportZip(warband)
              .then((outcome) => outcome !== 'cancelled' && toast.success('Warband exported'))
              .catch(() => toast.error('The warband could not be exported. Try again.'))
          }}
          onDelete={() => setDeleteOpen(true)}
        />
      </div>

      <ValidationPanel messages={view.messages.filter((m) => m.issue.kind !== 'empty')} />

      {view.rows.length === 0 ? (
        <EmptyState title="No models yet. Add your first model.">
          Create a new model, or pick one you have already made from your library.
        </EmptyState>
      ) : (
        <Roster
          rows={view.rows}
          rules={rules}
          selectedModelId={isDesktop ? selectedModelId : undefined}
          newModelId={newModelId}
          onEdit={(modelId) => openEditor({ kind: 'existing', modelId })}
          onDuplicate={(modelId) => {
            const copy = actions.duplicateEntry(warband.id, modelId)
            if (copy) {
              setNewModelId(copy)
              toast.success('Model duplicated')
            }
          }}
          onRemove={(modelId) => {
            actions.removeEntry(warband.id, modelId)
            if (selectedModelId === modelId) setEditing(undefined)
            toast('Removed from warband. The model is still in your library.')
          }}
          onQuantityChange={(modelId, quantity) => actions.updateEntry(warband.id, modelId, { quantity })}
          onMove={(from, to) => actions.moveEntry(warband.id, from, to)}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openEditor({ kind: 'new' })}>
          <Plus /> Add model
        </Button>
        <Button variant="outline" onClick={() => setPickerOpen(true)} disabled={models.length === 0}>
          <Library /> Add from library
        </Button>
      </div>
    </div>
  )

  const pointsBar = (
    <PointsBar
      total={view.totals.total}
      cap={warband.pointsCap}
      hasUnknown={view.totals.hasUnknown}
      modelCount={view.totals.modelCount}
      groupCount={view.totals.groupCount}
      className={
        isDesktop
          ? 'sticky bottom-0'
          : 'fixed inset-x-0 bottom-0 z-30 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
      }
    />
  )

  return (
    <>
      {isDesktop ? (
        <ResizablePanelGroup orientation="horizontal" className="h-[calc(100dvh-3.5rem)]">
          <ResizablePanel defaultSize="60%" minSize="35%">
            <div className="flex h-full flex-col overflow-y-auto">
              <div className="flex-1">{rosterColumn}</div>
              {pointsBar}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize editor" />
          <ResizablePanel defaultSize="40%" minSize="28%">
            <aside aria-label={editing ? editTitle : 'Model editor'} className="flex h-full flex-col bg-popover">
              {editing ? (
                <>
                  <h2 className="border-b px-4 py-3 font-display text-2xl font-semibold">{editTitle}</h2>
                  <div className="flex min-h-0 flex-1 flex-col pt-4">{editor}</div>
                </>
              ) : (
                <div className="p-6">
                  <EmptyState title="No model selected">Select a model in the roster to edit it, or add a new one.</EmptyState>
                </div>
              )}
            </aside>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
          <div className="pb-28">{rosterColumn}</div>
          {pointsBar}
          <EditorSheet open={Boolean(editing)} title={editTitle} side="bottom" onOpenChange={(open) => !open && setEditing(undefined)}>
            {editor}
          </EditorSheet>
        </>
      )}

      <LibraryPickerDialog
        open={pickerOpen}
        items={pickerItems}
        onOpenChange={setPickerOpen}
        onPick={(modelId) => {
          actions.addEntry(warband.id, modelId)
          setNewModelId(modelId)
          setPickerOpen(false)
          toast.success('Model added')
        }}
      />

      <WarbandSettingsDialog
        open={settingsOpen}
        title="Warband settings"
        submitLabel="Save warband"
        initial={warband}
        onOpenChange={setSettingsOpen}
        onSubmit={(settings) => {
          actions.updateWarband(warband.id, settings)
          setSettingsOpen(false)
          toast.success('Warband saved')
        }}
      />

      <ShareDialog
        open={shareOpen}
        url={share}
        onOpenChange={setShareOpen}
        onCopy={() => {
          navigator.clipboard
            .writeText(share)
            .then(() => toast.success('Link copied'))
            .catch(() => toast.error('The link could not be copied. Select it and copy it by hand.'))
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${warband.name}?`}
        description="The warband is removed from this device. Its models stay in your library. This cannot be undone."
        confirmLabel="Delete warband"
        onConfirm={() => {
          actions.deleteWarband(warband.id)
          toast.success('Warband deleted')
          void navigate('/')
        }}
      />
    </>
  )
}
