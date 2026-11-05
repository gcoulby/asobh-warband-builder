import { useCallback } from 'react'
import { toast } from 'sonner'
import type { ImageChange } from '@/components/ImageField'
import { ModelPanel, type ModelPatch } from '@/components/ModelPanel'
import { RulesEmptyHint } from '@/components/RulesEmptyHint'
import { usePersistenceContext } from '@/hooks/persistence-context'
import { useImageUrls } from '@/hooks/use-image-urls'
import { modelCost } from '@/lib/cost'
import { booksInUse, editionIdOf, editionOf, rulesFor } from '@/lib/editions'
import { loadBundledProfiles } from '@/lib/profiles-loader'
import type { Model } from '@/lib/schema'
import { useDataStore } from '@/stores/data-store'

interface ModelPanelContainerProps {
  modelId: string
  /** When set, quantity and Add to warband act on this warband. */
  warbandId?: string
}

/** Wires the model panel to the store. Edits are saved as they happen. */
export function ModelPanelContainer({ modelId, warbandId }: ModelPanelContainerProps) {
  const model = useDataStore((s) => s.models.find((m) => m.id === modelId))
  const rules = useDataStore((s) => s.rules)
  const warbands = useDataStore((s) => s.warbands)
  const saveModel = useDataStore((s) => s.saveModel)
  const addEntry = useDataStore((s) => s.addEntry)
  const updateEntry = useDataStore((s) => s.updateEntry)
  const { saveImage, deleteImage } = usePersistenceContext()
  const imageUrls = useImageUrls([model?.imageId])

  const latest = useCallback(() => useDataStore.getState().models.find((m) => m.id === modelId), [modelId])

  const handlePatch = useCallback(
    (patch: ModelPatch) => {
      const current = latest()
      if (!current) return
      const next: Model = { ...current, ...patch }
      if (next.notes !== undefined && next.notes.trim() === '') delete next.notes
      saveModel(next)
    },
    [latest, saveModel],
  )

  const handleImage = useCallback(
    (change: ImageChange) => {
      const current = latest()
      if (!current || change.kind === 'keep') return
      const oldId = current.imageId
      const apply = (imageId: string | undefined) => {
        const fresh = latest()
        if (!fresh) return
        const next: Model = { ...fresh, imageId }
        if (!imageId) delete next.imageId
        saveModel(next)
        if (oldId && oldId !== imageId) void deleteImage(oldId)
      }
      if (change.kind === 'remove') {
        apply(undefined)
        return
      }
      saveImage(change.blob)
        .then(apply)
        .catch(() => toast.error('The picture could not be saved. Browser storage may be full.'))
    },
    [latest, saveModel, saveImage, deleteImage],
  )

  if (!model) return <p className="p-3 text-sm text-muted-foreground">This model no longer exists.</p>

  const warband = warbandId ? warbands.find((w) => w.id === warbandId) : undefined
  const entry = warband?.entries.find((e) => e.modelId === model.id)
  const usageCount = warbands.filter((w) => w.entries.some((e) => e.modelId === model.id)).length
  const edition = editionOf(model)
  // Inside a warband of the same game, only its books are offered. Elsewhere, every book is.
  const books = warband && editionIdOf(warband) === edition.id ? booksInUse(edition, warband.books) : undefined
  const pickable = rulesFor(rules, edition.id, books)

  return (
    <ModelPanel
      key={model.id}
      model={model}
      rules={rules}
      pickableRules={pickable}
      cost={modelCost(model, rules)}
      imageUrl={model.imageId ? imageUrls.get(model.imageId) : undefined}
      quantity={entry?.quantity}
      usageCount={usageCount}
      rulesEmptyState={<RulesEmptyHint edition={rules.length > 0 ? edition.shortLabel : undefined} />}
      profile={model.profileId ? loadBundledProfiles().profiles.find((p) => p.id === model.profileId) : undefined}
      onPatch={handlePatch}
      onImageChange={handleImage}
      onQuantityChange={warband && entry ? (quantity) => updateEntry(warband.id, model.id, { quantity }) : undefined}
      onAddToWarband={warband && !entry ? () => addEntry(warband.id, model.id) : undefined}
    />
  )
}
