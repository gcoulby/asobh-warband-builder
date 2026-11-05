import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { BuilderPanel } from '@/components/BuilderPanel'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { BookItem } from '@/components/BookProfileList'
import { LibraryPanel, type LibraryItem } from '@/components/LibraryPanel'
import { PointsBar } from '@/components/PointsBar'
import { Roster } from '@/components/Roster'
import { ShareDialog } from '@/components/ShareDialog'
import { ValidationPopover } from '@/components/ValidationPopover'
import { WarbandActions } from '@/components/WarbandActions'
import { WarbandMenu } from '@/components/WarbandMenu'
import { WarbandSettingsDialog } from '@/components/WarbandSettingsDialog'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModelPanelContainer } from '@/containers/ModelPanelContainer'
import { gameSizeOptions, isStrictRoster, MIXED_ROSTER, rosterLabel } from '@/data/warband-options'
import { useImageUrls } from '@/hooks/use-image-urls'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { usePrefs } from '@/hooks/use-prefs'
import { useRoster } from '@/hooks/use-roster'
import { useDeleteModel } from '@/hooks/use-delete-model'
import { useWarbandFiles } from '@/hooks/use-warband-files'
import { bundleWarband } from '@/lib/bundle'
import { modelCost } from '@/lib/cost'
import { editionIdOf, editionOf } from '@/lib/editions'
import { loadBundledProfiles } from '@/lib/profiles-loader'
import { shareUrl } from '@/lib/share'
import { selectStoredData, useDataStore } from '@/stores/data-store'
import { NotFoundPage } from '@/pages/NotFoundPage'

type MobileView = 'library' | 'warband' | 'model'
const isMobileView = (v: string): v is MobileView => v === 'library' || v === 'warband' || v === 'model'

/**
 * The builder. Library on the left, the warband in the middle, the selected
 * model on the right. Each column scrolls on its own. Below desktop width the
 * three columns become tabs.
 */
export function WarbandPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [prefs, setPrefs] = usePrefs()

  const warband = useDataStore((s) => s.warbands.find((w) => w.id === id))
  const models = useDataStore((s) => s.models)
  const rules = useDataStore((s) => s.rules)
  const actions = useDataStore.getState()

  const imageUrls = useImageUrls(useMemo(() => models.map((m) => m.imageId), [models]))
  const view = useRoster(warband, models, rules, imageUrls)
  const files = useWarbandFiles()

  const [selectedId, setSelectedId] = useState<string | undefined>(() =>
    prefs.lastModelId && warband?.entries.some((e) => e.modelId === prefs.lastModelId) ? prefs.lastModelId : undefined,
  )
  const [newModelId, setNewModelId] = useState<string>()
  const [mobileView, setMobileView] = useState<MobileView>('warband')
  const book = loadBundledProfiles()
  const edition = editionOf(warband ?? {})
  const strict = warband ? isStrictRoster(warband) : false
  const warbandRoster = warband?.roster && warband.roster !== MIXED_ROSTER ? warband.roster : undefined
  const [chosenBookRoster, setChosenBookRoster] = useState<string>()
  const bookRoster = strict ? warbandRoster : (chosenBookRoster ?? warbandRoster ?? book.rosters[0]?.id)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingModelId, setDeletingModelId] = useState<string>()
  const deleteModel = useDeleteModel()
  const allWarbands = useDataStore((s) => s.warbands)

  useEffect(() => {
    if (warband) setPrefs({ lastWarbandId: warband.id })
  }, [warband?.id, setPrefs, warband])

  const libraryItems = useMemo<LibraryItem[]>(
    () =>
      [...models]
        .filter((model) => editionIdOf(model) === edition.id)
        .filter((model) => !strict || !model.roster || model.roster === warbandRoster)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((model) => ({
          model,
          cost: modelCost(model, rules),
          imageUrl: model.imageId ? imageUrls.get(model.imageId) : undefined,
          ruleNames: model.ruleIds.map((rid) => rules.find((r) => r.id === rid)?.name ?? rid),
          inWarband: warband?.entries.find((e) => e.modelId === model.id)?.quantity ?? 0,
        })),
    [models, rules, imageUrls, warband, strict, warbandRoster, edition.id],
  )
  const sameEdition = models.filter((m) => editionIdOf(m) === edition.id)
  const hiddenByEdition = models.length - sameEdition.length
  const hiddenByRoster = strict ? sameEdition.filter((m) => m.roster && m.roster !== warbandRoster).length : 0
  const plural = (n: number) => (n === 1 ? 'model' : 'models')
  const hiddenNotes = [
    hiddenByEdition > 0 && `${hiddenByEdition} ${plural(hiddenByEdition)} for other games hidden.`,
    hiddenByRoster > 0 && `${hiddenByRoster} ${plural(hiddenByRoster)} from other rosters hidden by strict roster.`,
  ].filter((n): n is string => Boolean(n))

  const bookItems = useMemo<BookItem[]>(
    () =>
      book.profiles
        .filter((profile) => profile.roster === bookRoster)
        .map((profile) => ({
          profile,
          cost: modelCost({ ...profile, profileId: profile.id }, rules),
          inWarband: (warband?.entries ?? [])
            .filter((e) => models.find((m) => m.id === e.modelId)?.profileId === profile.id)
            .reduce((sum, e) => sum + e.quantity, 0),
        })),
    [book.profiles, bookRoster, rules, warband, models],
  )

  if (!warband || !view) return <NotFoundPage what="warband" />

  const deletingModel = deletingModelId ? models.find((m) => m.id === deletingModelId) : undefined
  const deletingUsage = deletingModelId
    ? allWarbands.filter((w) => w.entries.some((e) => e.modelId === deletingModelId)).length
    : 0
  const selectedExists = selectedId !== undefined && models.some((m) => m.id === selectedId)

  const select = (modelId: string, openOnMobile = true) => {
    setSelectedId(modelId)
    setPrefs({ lastModelId: modelId })
    if (openOnMobile) setMobileView('model')
  }

  const addToWarband = (modelId: string, knownName?: string) => {
    actions.addEntry(warband.id, modelId)
    setNewModelId(modelId)
    select(modelId, false)
    const name = knownName ?? models.find((m) => m.id === modelId)?.name ?? 'Model'
    toast.success(`${name} added`)
  }

  const addProfile = (profileId: string) => {
    const profile = book.profiles.find((p) => p.id === profileId)
    if (!profile) return
    const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((v, i) => v === b[i])
    const existing = models.find(
      (m) =>
        m.profileId === profile.id &&
        m.name === profile.name &&
        m.quality === profile.quality &&
        m.combat === profile.combat &&
        same(m.ruleIds, profile.ruleIds),
    )
    const modelId =
      existing?.id ??
      actions.createModel({
        name: profile.name,
        quality: profile.quality,
        combat: profile.combat,
        ruleIds: [...profile.ruleIds],
        roster: profile.roster,
        profileId: profile.id,
        edition: edition.id,
        ...(profile.choices ? { notes: `Book options: ${profile.choices.join('; ')}` } : {}),
      })
    addToWarband(modelId, profile.name)
  }

  const createModel = () => {
    const modelId = actions.createModel({
      name: 'New model',
      edition: edition.id,
      ...(warbandRoster ? { roster: warbandRoster } : {}),
    })
    actions.addEntry(warband.id, modelId)
    setNewModelId(modelId)
    select(modelId)
  }

  const share = shareOpen
    ? shareUrl(bundleWarband(warband, selectStoredData(useDataStore.getState())), window.location.origin, import.meta.env.BASE_URL)
    : ''

  const sizeLabel = gameSizeOptions.find((o) => o.points === warband.pointsCap)?.label
  const meta = [edition.shortLabel, sizeLabel, rosterLabel(warband.roster), warband.theme].filter(Boolean).join(' · ')
  const errorCount = view.messages.filter((m) => m.severity === 'error').length
  const warningCount = view.messages.filter((m) => m.severity === 'warning' && m.issue.kind !== 'empty').length

  const library = (
    <LibraryPanel
      items={libraryItems}
      rules={rules}
      selectedModelId={selectedId}
      onSelect={(modelId) => select(modelId)}
      onAdd={(modelId) => addToWarband(modelId)}
      onNew={createModel}
      onDuplicate={(modelId) => {
        const copy = actions.duplicateModel(modelId)
        if (copy) {
          select(copy)
          toast.success('Model duplicated')
        }
      }}
      onDelete={setDeletingModelId}
      showNoncombatants={prefs.showNoncombatants}
      onShowNoncombatantsChange={(shown) => setPrefs({ showNoncombatants: shown })}
      hiddenNotes={hiddenNotes}
      bookItems={bookItems}
      bookRosters={edition.hasRosters ? book.rosters : []}
      bookRoster={bookRoster}
      onBookRosterChange={setChosenBookRoster}
      bookRosterLocked={strict}
      onAddProfile={addProfile}
    />
  )

  const warbandPanel = (
    <BuilderPanel
      label="Warband"
      header={
        <div className="flex items-start gap-1">
          <Button asChild variant="ghost" size="icon" className="-ml-2 shrink-0">
            <Link to="/" aria-label="Back to warbands">
              <ChevronLeft />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="group flex max-w-full items-center gap-1.5 text-left font-display text-xl leading-tight font-bold"
              >
                <span className="truncate">{warband.name}</span>
                <Pencil className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                <span className="sr-only">, change warband settings</span>
              </button>
            </h1>
            {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
          </div>
          <ValidationPopover messages={view.messages.filter((m) => m.issue.kind !== 'empty')} />
          <WarbandActions
            onPrint={() => void navigate(`/print/${warband.id}`)}
            onShare={() => setShareOpen(true)}
            onExportZip={() => {
              files
                .exportZip(warband)
                .then((outcome) => outcome !== 'cancelled' && toast.success('Warband exported'))
                .catch(() => toast.error('The warband could not be exported. Try again.'))
            }}
          />
          <WarbandMenu onSettings={() => setSettingsOpen(true)} onDelete={() => setDeleteOpen(true)} />
        </div>
      }
      footer={
        isDesktop && (
          <PointsBar
            total={view.totals.total}
            cap={warband.pointsCap}
            hasUnknown={view.totals.hasUnknown}
            modelCount={view.totals.modelCount}
            groupCount={view.totals.groupCount}
            errorCount={errorCount}
            warningCount={warningCount}
          />
        )
      }
    >
      {view.rows.length === 0 ? (
        <div className="flex flex-col items-start gap-2 p-3 text-sm text-muted-foreground">
          <p>No models yet. Add one from the library with +, or create a new one.</p>
          <Button size="sm" onClick={createModel}>
            <Plus /> New model
          </Button>
        </div>
      ) : (
        <Roster
          rows={view.rows}
          rules={rules}
          selectedModelId={selectedId}
          newModelId={newModelId}
          onEdit={(modelId) => select(modelId)}
          onDuplicate={(modelId) => {
            const copy = actions.duplicateEntry(warband.id, modelId)
            if (copy) {
              setNewModelId(copy)
              select(copy, false)
              toast.success('Model duplicated')
            }
          }}
          onRemove={(modelId) => {
            actions.removeEntry(warband.id, modelId)
            toast('Removed from warband. The model is still in your library.')
          }}
          onQuantityChange={(modelId, quantity) => actions.updateEntry(warband.id, modelId, { quantity })}
          onMove={(from, to) => actions.moveEntry(warband.id, from, to)}
        />
      )}
    </BuilderPanel>
  )

  const modelPanel = (
    <BuilderPanel label="Selected model">
      {selectedId && selectedExists ? (
        <ModelPanelContainer key={selectedId} modelId={selectedId} warbandId={warband.id} />
      ) : (
        <p className="p-3 text-sm text-muted-foreground">
          Select a model in the warband or the library to edit it here.
        </p>
      )}
    </BuilderPanel>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      {isDesktop ? (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="26%" minSize="18%">
            {library}
          </ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize library" />
          <ResizablePanel defaultSize="38%" minSize="28%">
            {warbandPanel}
          </ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize model panel" />
          <ResizablePanel defaultSize="36%" minSize="26%">
            {modelPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <Tabs
          value={mobileView}
          onValueChange={(v) => isMobileView(v) && setMobileView(v)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList className="h-auto w-full shrink-0 rounded-none border-b bg-card p-1 group-data-horizontal/tabs:h-auto">
            <TabsTrigger value="library" className="h-9">
              Library
            </TabsTrigger>
            <TabsTrigger value="warband" className="h-9">
              Warband <span className="text-muted-foreground tabular-nums">{view.totals.modelCount}</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="h-9" disabled={!selectedExists}>
              Model
            </TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="min-h-0">
            {library}
          </TabsContent>
          <TabsContent value="warband" className="min-h-0">
            {warbandPanel}
          </TabsContent>
          <TabsContent value="model" className="min-h-0">
            {modelPanel}
          </TabsContent>
          <PointsBar
            total={view.totals.total}
            cap={warband.pointsCap}
            hasUnknown={view.totals.hasUnknown}
            modelCount={view.totals.modelCount}
            groupCount={view.totals.groupCount}
            errorCount={errorCount}
            warningCount={warningCount}
            className="shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          />
        </Tabs>
      )}

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
        open={deletingModel !== undefined}
        onOpenChange={(open) => !open && setDeletingModelId(undefined)}
        title={`Delete ${deletingModel?.name ?? 'model'}?`}
        description={
          deletingUsage > 0
            ? `It is used in ${deletingUsage} ${deletingUsage === 1 ? 'warband' : 'warbands'} and will be removed from ${deletingUsage === 1 ? 'it' : 'them'}. This cannot be undone.`
            : 'It is removed from your library. This cannot be undone.'
        }
        confirmLabel="Delete model"
        onConfirm={() => {
          if (!deletingModelId) return
          deleteModel(deletingModelId)
          if (selectedId === deletingModelId) setSelectedId(undefined)
          setDeletingModelId(undefined)
          toast.success('Model deleted')
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
    </div>
  )
}
