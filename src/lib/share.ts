import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { z } from 'zod'
import { warbandBundleSchema, type Result, type WarbandBundle } from '@/lib/schema'

const SHARE_VERSION = 1

const sharePayloadSchema = z.object({
  v: z.literal(SHARE_VERSION),
  bundle: warbandBundleSchema,
})

/** Removes image references, since pictures never travel in a link. */
const withoutImages = (bundle: WarbandBundle): WarbandBundle => ({
  ...bundle,
  models: bundle.models.map(({ imageId: _imageId, ...model }) => model),
})

export function encodeShare(bundle: WarbandBundle): string {
  return compressToEncodedURIComponent(JSON.stringify({ v: SHARE_VERSION, bundle: withoutImages(bundle) }))
}

export function decodeShare(payload: string): Result<WarbandBundle> {
  const broken = 'This share link is damaged or incomplete. Ask for the link again and copy all of it.'
  let json: string | null
  try {
    json = decompressFromEncodedURIComponent(payload)
  } catch {
    return { ok: false, error: broken }
  }
  if (!json) return { ok: false, error: broken }

  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return { ok: false, error: broken }
  }

  const parsed = sharePayloadSchema.safeParse(data)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'This share link was made by a different version of the app and cannot be read here.',
    }
  }
  return { ok: true, value: parsed.data.bundle }
}

export function shareUrl(bundle: WarbandBundle, origin: string, baseUrl: string): string {
  return `${origin}${baseUrl}#/s/${encodeShare(bundle)}`
}
