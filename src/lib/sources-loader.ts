import { readSourceData, type SourceEntryError } from '@/lib/sources'
import type { Source } from '@/lib/schema'

export interface BundledSource {
  fileName: string
  source?: Source
  /** Why the file could not be read at all. */
  error?: string
  errors: SourceEntryError[]
}

/**
 * Source files in .temp/sources are offered in the source manager. That folder
 * is not committed, so a build without it offers none, and sources are added
 * from files instead.
 */
const bundledFiles = import.meta.glob<unknown>('../../.temp/sources/*.json', { eager: true, import: 'default' })

let cache: BundledSource[] | undefined

export function loadBundledSources(): BundledSource[] {
  if (cache) return cache
  cache = Object.entries(bundledFiles).map(([path, data]) => {
    const fileName = path.split('/').pop() ?? path
    const result = readSourceData(data)
    return result.ok
      ? { fileName, source: { ...result.source, origin: result.source.id }, errors: result.errors }
      : { fileName, error: result.error, errors: [] }
  })
  return cache
}

/** Bundled sources that loaded, in a stable order: each game's core source first. */
export function bundledSources(): Source[] {
  return loadBundledSources()
    .flatMap((b) => (b.source ? [b.source] : []))
    .sort((a, b) => a.game.localeCompare(b.game) || (a.kind === 'core' ? -1 : b.kind === 'core' ? 1 : a.name.localeCompare(b.name)))
}
