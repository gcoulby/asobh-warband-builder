import { useCallback } from 'react'
import { usePersistenceContext } from '@/hooks/persistence-context'
import { useDataStore } from '@/stores/data-store'

/** Deletes a model from the library and every warband, and clears its stored picture. */
export function useDeleteModel() {
  const { deleteImage } = usePersistenceContext()
  const deleteModel = useDataStore((s) => s.deleteModel)
  return useCallback(
    (modelId: string) => {
      const imageId = useDataStore.getState().models.find((m) => m.id === modelId)?.imageId
      deleteModel(modelId)
      if (imageId) void deleteImage(imageId)
    },
    [deleteImage, deleteModel],
  )
}
