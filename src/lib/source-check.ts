import { idClashes, readSourceText } from '@/lib/sources'
import type { Source } from '@/lib/schema'

/** A source file's path and contents. */
export interface SourceFileText {
  path: string
  text: string
}

/** What reading one file gave. */
export interface SourceFileCheck {
  path: string
  source?: Source
  /** True when the source replaces one you already have. */
  replaces?: boolean
  /** Entries in the file that were left out because they are not valid. */
  skipped?: number
  problem?: string
}

/**
 * Checks several source files together, in order. A file is skipped when it is
 * not a source, holds nothing, repeats an earlier file's source id, or uses
 * rule or roster ids that another source has. Earlier files win.
 */
export function checkSourceFiles(files: readonly SourceFileText[], existing: readonly Source[]): SourceFileCheck[] {
  const accepted: Source[] = [...existing]
  const seenIds = new Set<string>()
  return files.map(({ path, text }) => {
    const result = readSourceText(text, path.split('/').pop()?.replace(/\.json$/i, ''))
    if (!result.ok) return { path, problem: result.error }
    const { source } = result
    if (seenIds.has(source.id)) return { path, problem: `Another file here is also source "${source.id}".` }
    const clashes = idClashes(source, accepted)
    if (clashes.length > 0) {
      return { path, problem: `Uses ids another source has: ${clashes.slice(0, 3).join(', ')}${clashes.length > 3 ? '…' : ''}.` }
    }
    if (source.rules.length + source.profiles.length === 0) return { path, problem: 'Holds no rules or profiles.' }
    seenIds.add(source.id)
    const index = accepted.findIndex((s) => s.id === source.id)
    if (index >= 0) accepted[index] = source
    else accepted.push(source)
    return { path, source, replaces: existing.some((s) => s.id === source.id), skipped: result.errors.length }
  })
}

export const validSources = (checks: readonly SourceFileCheck[]): Source[] => checks.flatMap((c) => (c.source ? [c.source] : []))
