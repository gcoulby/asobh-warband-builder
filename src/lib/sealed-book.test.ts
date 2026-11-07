import { BookUnlockError, isSealedBook, openBook, sealBook } from '@/lib/sealed-book'

const files = [
  { name: 'a.json', text: '{"format":"warband-source"}' },
  { name: 'b.json', text: 'Ünïcødé ✓' },
]

describe('sealed book', () => {
  it('opens with the passphrase it was sealed with', async () => {
    const book = await sealBook(files, 'correct horse battery staple', { iterations: 1000 })
    expect(isSealedBook(book)).toBe(true)
    expect(book.fileCount).toBe(2)
    expect(book.data).not.toContain('warband-source')
    expect(await openBook(book, 'correct horse battery staple')).toEqual(files)
  })

  it('refuses a wrong passphrase', async () => {
    const book = await sealBook(files, 'correct horse battery staple', { iterations: 1000 })
    await expect(openBook(book, 'wrong horse battery staple')).rejects.toBeInstanceOf(BookUnlockError)
  })

  it('refuses a header swapped onto other data', async () => {
    const book = await sealBook(files, 'correct horse battery staple', { iterations: 1000 })
    await expect(openBook({ ...book, sealedAt: '2030-01-01T00:00:00.000Z' }, 'correct horse battery staple')).rejects.toBeInstanceOf(
      BookUnlockError,
    )
  })

  it('uses a fresh salt and iv each time', async () => {
    const [a, b] = await Promise.all([sealBook(files, 'x'.repeat(16), { iterations: 1000 }), sealBook(files, 'x'.repeat(16), { iterations: 1000 })])
    expect(a.kdf.salt).not.toBe(b.kdf.salt)
    expect(a.cipher.iv).not.toBe(b.cipher.iv)
  })

  it('rejects things that are not sealed books', () => {
    expect(isSealedBook({ format: 'warband-source' })).toBe(false)
    expect(isSealedBook(null)).toBe(false)
  })
})
