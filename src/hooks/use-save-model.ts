import { useCallback } from 'react'
import type { ImageChange } from '@/components/ImageField'
import type { ModelEditorValues } from '@/components/ModelEditor'
import { usePersistenceContext } from '@/hooks/persistence-context'
import type { Model } from '@/lib/schema'
import { useDataStore } from '@/stores/data-store'

/** Saves a model from the editor, storing a new picture first and clearing the old one. */
export function useSaveModel() {
  const { saveImage, deleteImage } = usePersistenceContext()
  const saveModel = useDataStore((s) => s.saveModel)

  return useCallback(
    async (model: Model, values: ModelEditorValues, image: ImageChange): Promise<Model> => {
      let imageId = model.imageId
      if (image.kind === 'set') imageId = await saveImage(image.blob)
      if (image.kind === 'remove') imageId = undefined

      const notes = values.notes.trim()
      const next: Model = {
        id: model.id,
        name: values.name.trim(),
        quality: values.quality,
        combat: values.combat,
        ruleIds: values.ruleIds,
        ...(imageId ? { imageId } : {}),
        ...(notes ? { notes } : {}),
      }
      saveModel(next)
      if (model.imageId && model.imageId !== imageId) void deleteImage(model.imageId)
      return next
    },
    [saveImage, deleteImage, saveModel],
  )
}
