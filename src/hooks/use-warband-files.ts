import { useCallback } from 'react'
import { toBlob } from 'html-to-image'
import { usePersistenceContext } from '@/hooks/persistence-context'
import { buildArchive, readArchive, type ArchiveImage } from '@/lib/archive'
import { bundleWarband } from '@/lib/bundle'
import { fileNameFor, openFile, pngFileType, saveFile, zipFileType, type SaveOutcome } from '@/lib/file-access'
import type { Result, Warband } from '@/lib/schema'
import { useDataStore } from '@/stores/data-store'

/** Export and import warband archives and PNG pictures of the roster. */
export function useWarbandFiles() {
  const { getImage, saveImage } = usePersistenceContext()
  const importBundle = useDataStore((s) => s.importBundle)

  const exportZip = useCallback(
    async (warband: Warband): Promise<SaveOutcome> => {
      const bundle = bundleWarband(warband, useDataStore.getState())
      const images: ArchiveImage[] = []
      for (const model of bundle.models) {
        if (!model.imageId) continue
        const blob = await getImage(model.imageId)
        if (blob) images.push({ id: model.imageId, type: blob.type, data: new Uint8Array(await blob.arrayBuffer()) })
      }
      const zipped = await buildArchive(bundle, images)
      return saveFile(new Blob([new Uint8Array(zipped)], { type: 'application/zip' }), fileNameFor(warband.name, 'zip'), zipFileType)
    },
    [getImage],
  )

  /** Asks for a .zip and saves its warband as a new copy. Resolves to the new warband id, or null if cancelled. */
  const importZip = useCallback(async (): Promise<Result<string> | null> => {
    const file = await openFile(zipFileType)
    if (!file) return null
    const read = await readArchive(await file.arrayBuffer())
    if (!read.ok) return read

    const imageIdMap = new Map<string, string>()
    for (const image of read.value.images) {
      const blob = new Blob([new Uint8Array(image.data)], { type: image.type })
      imageIdMap.set(image.id, await saveImage(blob))
    }
    return { ok: true, value: importBundle(read.value.bundle, imageIdMap) }
  }, [saveImage, importBundle])

  const exportPng = useCallback(async (node: HTMLElement, name: string): Promise<SaveOutcome> => {
    const background = getComputedStyle(node).backgroundColor
    const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: background, cacheBust: true })
    if (!blob) throw new Error('The picture could not be made.')
    return saveFile(blob, fileNameFor(name, 'png'), pngFileType)
  }, [])

  return { exportZip, importZip, exportPng }
}
