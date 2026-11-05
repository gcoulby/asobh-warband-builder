import { useState } from 'react'
import { toast } from 'sonner'
import { ModelEditor } from '@/components/ModelEditor'
import { RulesEmptyHint } from '@/components/RulesEmptyHint'
import { defaultProfile } from '@/data/profile-options'
import { useImageUrls } from '@/hooks/use-image-urls'
import { useSaveModel } from '@/hooks/use-save-model'
import type { Model } from '@/lib/schema'
import { newId, useDataStore } from '@/stores/data-store'

export type EditTarget = { kind: 'existing'; modelId: string } | { kind: 'new' }

interface ModelEditorContainerProps {
  target: EditTarget
  /** When set, the model is edited as a row of this warband. */
  warbandId?: string
  onDone: (savedModelId?: string) => void
}

export function ModelEditorContainer({ target, warbandId, onDone }: ModelEditorContainerProps) {
  const existing = useDataStore((s) =>
    target.kind === 'existing' ? s.models.find((m) => m.id === target.modelId) : undefined,
  )
  const [draft] = useState<Model>(() => ({
    id: newId(),
    name: '',
    quality: defaultProfile.quality,
    combat: defaultProfile.combat,
    ruleIds: [],
  }))
  const model = target.kind === 'existing' ? existing : draft

  const rules = useDataStore((s) => s.rules)
  const warbands = useDataStore((s) => s.warbands)
  const addEntry = useDataStore((s) => s.addEntry)
  const save = useSaveModel()
  const imageUrls = useImageUrls([model?.imageId])

  if (!model) {
    return <p className="p-4 text-muted-foreground">This model no longer exists.</p>
  }

  const warband = warbandId ? warbands.find((w) => w.id === warbandId) : undefined
  const entry = warband?.entries.find((e) => e.modelId === model.id)
  const usageCount = warbands.filter((w) => w.entries.some((e) => e.modelId === model.id)).length

  return (
    <ModelEditor
      key={model.id}
      model={model}
      rules={rules}
      imageUrl={model.imageId ? imageUrls.get(model.imageId) : undefined}
      usageCount={usageCount}
      rulesEmptyState={<RulesEmptyHint />}
      onCancel={() => onDone()}
      onSubmit={(values, image) => {
        void save(model, values, image)
          .then((saved) => {
            if (warbandId && !entry) addEntry(warbandId, saved.id)
            toast.success('Model saved')
            onDone(saved.id)
          })
          .catch(() => toast.error('The model could not be saved. Browser storage may be full.'))
      }}
    />
  )
}
