import { useState } from 'react'
import { BookUp } from 'lucide-react'
import { BookUnlockDialog } from '@/components/BookUnlockDialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useBookImport } from '@/hooks/use-book-import'
import { usePrefs } from '@/hooks/use-prefs'
import { useSealedBook } from '@/hooks/use-sealed-book'
import { sealedDate } from '@/lib/sealed-book'
import { useDataStore } from '@/stores/data-store'

/**
 * Says when newer book data is published than this device last unlocked.
 * Shows nothing on a device that has never unlocked it.
 */
export function BookUpdateNotice() {
  const book = useSealedBook()
  const [prefs] = usePrefs()
  const sources = useDataStore((s) => s.sources)
  const importBook = useBookImport()
  const [open, setOpen] = useState(false)

  if (!book || !prefs.bookSealedAt || prefs.bookSealedAt === book.sealedAt) return null

  return (
    <>
      <Alert>
        <BookUp aria-hidden="true" />
        <AlertTitle>Updated book data is available</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>Sealed {sealedDate(book)}. Unlock it to update your sources on this device.</span>
          <Button size="sm" onClick={() => setOpen(true)}>
            Update
          </Button>
        </AlertDescription>
      </Alert>
      <BookUnlockDialog
        open={open}
        book={book}
        existing={sources}
        onOpenChange={setOpen}
        onImport={(list) => {
          importBook(book, list)
          setOpen(false)
        }}
      />
    </>
  )
}
