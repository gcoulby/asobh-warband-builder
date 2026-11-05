import JSZip from 'jszip'
import { warbandBundleSchema, type Result, type WarbandBundle } from '@/lib/schema'

const WARBAND_FILE = 'warband.json'
const IMAGE_DIR = 'images/'

const extensionFor = (type: string): string => {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/png') return 'png'
  return 'webp'
}

const typeFor = (fileName: string): string => {
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg'
  if (fileName.endsWith('.png')) return 'image/png'
  return 'image/webp'
}

export interface ArchiveImage {
  id: string
  type: string
  data: Uint8Array
}

/**
 * Builds a warband archive: `warband.json` plus one file per picture under
 * `images/`, named by image id. Pictures are stored as files, never inlined.
 */
export async function buildArchive(bundle: WarbandBundle, images: readonly ArchiveImage[]): Promise<Uint8Array> {
  const zip = new JSZip()
  zip.file(WARBAND_FILE, JSON.stringify({ format: 'asobh-warband', version: 1, ...bundle }, null, 2))
  for (const image of images) {
    zip.file(`${IMAGE_DIR}${image.id}.${extensionFor(image.type)}`, image.data)
  }
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
}

export interface ReadArchive {
  bundle: WarbandBundle
  images: ArchiveImage[]
}

export async function readArchive(data: Uint8Array | ArrayBuffer): Promise<Result<ReadArchive>> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(data)
  } catch {
    return { ok: false, error: 'This file is not a zip archive. Choose a warband .zip exported from this app.' }
  }

  const file = zip.file(WARBAND_FILE)
  if (!file) {
    return { ok: false, error: `The archive has no ${WARBAND_FILE}. Choose a warband .zip exported from this app.` }
  }

  let json: unknown
  try {
    json = JSON.parse(await file.async('string'))
  } catch {
    return { ok: false, error: `${WARBAND_FILE} in the archive is not valid JSON.` }
  }

  const parsed = warbandBundleSchema.safeParse(json)
  if (!parsed.success) {
    const where = parsed.error.issues
      .slice(0, 3)
      .map((i) => i.path.join('.') || 'file')
      .join(', ')
    return { ok: false, error: `${WARBAND_FILE} in the archive is not a valid warband (problems at ${where}).` }
  }

  const wanted = new Set(parsed.data.models.flatMap((m) => (m.imageId ? [m.imageId] : [])))
  const images: ArchiveImage[] = []
  for (const entry of Object.values(zip.files)) {
    if (entry.dir || !entry.name.startsWith(IMAGE_DIR)) continue
    const fileName = entry.name.slice(IMAGE_DIR.length)
    const id = fileName.replace(/\.[^.]+$/, '')
    if (!wanted.has(id)) continue
    images.push({ id, type: typeFor(fileName), data: await entry.async('uint8array') })
  }

  return { ok: true, value: { bundle: parsed.data, images } }
}
