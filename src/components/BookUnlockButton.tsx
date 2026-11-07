import { useState, type ReactNode } from 'react'
import { BookUnlockDialog } from '@/components/BookUnlockDialog'
import { useBookImport } from '@/hooks/use-book-import'
import { useSealedBook } from '@/hooks/use-sealed-book'
import { useDataStore } from '@/stores/data-store'

interface BookUnlockButtonProps {
  /** What to show. It looks like ordinary text, so the unlock stays out of the way. */
  children: ReactNode
}

/**
 * Text that opens the published sealed book data when clicked. Shows the text
 * alone, not clickable, when no book data is published.
 */
export function BookUnlockButton({ children }: BookUnlockButtonProps) {
  const book = useSealedBook()
  const sources = useDataStore((s) => s.sources)
  const importBook = useBookImport()
  const [open, setOpen] = useState(false)

  if (!book) return <>{children}</>

  return (
    <>
      <button type="button" className="cursor-text rounded-xs text-inherit focus-visible:outline-1 focus-visible:outline-ring" onClick={() => setOpen(true)}>
        {children}
      </button>
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
