/** Card picture aspect ratio, width over height. */
export const CARD_ASPECT = 4 / 5

export const MAX_IMAGE_EDGE = 800

export interface PixelArea {
  x: number
  y: number
  width: number
  height: number
}

/** Scales a size down so its long edge is at most `max`. Never scales up. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= max) return { width: Math.round(width), height: Math.round(height) }
  const scale = max / longest
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The picture could not be read. Try a JPEG, PNG or WebP file.'))
    img.src = url
  })

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality))

/**
 * Crops a picture to `area`, scales it so the long edge is at most 800px and
 * encodes it as WebP, falling back to JPEG where the browser cannot write WebP.
 */
export async function cropAndCompress(sourceUrl: string, area: PixelArea): Promise<Blob> {
  const img = await loadImage(sourceUrl)
  const size = fitWithin(area.width, area.height, MAX_IMAGE_EDGE)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot process pictures.')
  context.imageSmoothingQuality = 'high'
  context.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size.width, size.height)

  const webp = await toBlob(canvas, 'image/webp', 0.82)
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.85)
  if (!jpeg) throw new Error('The picture could not be compressed.')
  return jpeg
}

/** Up to two initials from a model name, for the placeholder. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
}
