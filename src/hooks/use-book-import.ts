import { useCallback } from 'react'
import { toast } from 'sonner'
import { usePrefs } from '@/hooks/use-prefs'
import type { SealedBook } from '@/lib/sealed-book'
import type { Source } from '@/lib/schema'
import { useDataStore } from '@/stores/data-store'

/** Saves the sources from an unlocked book and remembers which version this device now has. */
export function useBookImport(): (book: SealedBook, sources: readonly Source[]) => void {
  const saveSource = useDataStore((s) => s.saveSource)
  const [, setPrefs] = usePrefs()
  return useCallback(
    (book, sources) => {
      sources.forEach(saveSource)
      setPrefs({ bookSealedAt: book.sealedAt })
      toast.success(`${sources.length} ${sources.length === 1 ? 'source' : 'sources'} imported from the book data`)
    },
    [saveSource, setPrefs],
  )
}
