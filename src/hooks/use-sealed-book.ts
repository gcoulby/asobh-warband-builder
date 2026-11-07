import { useEffect, useState } from 'react'
import { isSealedBook, type SealedBook } from '@/lib/sealed-book'

/** Where the deployed app keeps the sealed book data. */
export const SEALED_BOOK_URL = `${import.meta.env.BASE_URL}book.sealed.json`

let request: Promise<SealedBook | undefined> | undefined

/** The published sealed book, fetched once per visit. Undefined when there is none. */
export function fetchSealedBook(): Promise<SealedBook | undefined> {
  request ??= fetch(SEALED_BOOK_URL, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : undefined))
    .then((data: unknown) => (isSealedBook(data) ? data : undefined))
    .catch(() => undefined)
  return request
}

export function useSealedBook(): SealedBook | undefined {
  const [book, setBook] = useState<SealedBook>()
  useEffect(() => {
    let live = true
    void fetchSealedBook().then((b) => live && setBook(b))
    return () => {
      live = false
    }
  }, [])
  return book
}
