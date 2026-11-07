/**
 * A sealed book: source files, gzipped and encrypted with a passphrase, so the
 * data can be published without being readable. AES-GCM with a key from
 * PBKDF2-SHA-256. The header (format, version, sealedAt) is bound to the
 * ciphertext, so it cannot be swapped onto other data.
 *
 * Uses only Web Crypto and compression streams, so the same code runs in the
 * browser and in the Node script that seals the file. Keep it free of `@/` imports.
 */

export const SEALED_BOOK_FORMAT = 'warband-sealed-book'
export const SEALED_BOOK_VERSION = 1
/** PBKDF2 rounds: slow enough to make guessing costly, quick enough on a phone. */
export const DEFAULT_ITERATIONS = 600_000

export interface SealedBook {
  format: typeof SEALED_BOOK_FORMAT
  version: typeof SEALED_BOOK_VERSION
  /** When the book was sealed, as an ISO date. Also tells devices an update is out. */
  sealedAt: string
  fileCount: number
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string }
  cipher: { name: 'AES-GCM'; iv: string }
  data: string
}

/** One source file inside the book. */
export interface BookFile {
  name: string
  text: string
}

/** Thrown when the passphrase is wrong or the file was altered. */
export class BookUnlockError extends Error {
  constructor() {
    super('That passphrase does not unlock the book data.')
    this.name = 'BookUnlockError'
  }
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

export function isSealedBook(x: unknown): x is SealedBook {
  if (!isRecord(x) || !isRecord(x.kdf) || !isRecord(x.cipher)) return false
  return (
    x.format === SEALED_BOOK_FORMAT &&
    x.version === SEALED_BOOK_VERSION &&
    typeof x.sealedAt === 'string' &&
    typeof x.fileCount === 'number' &&
    x.kdf.name === 'PBKDF2' &&
    x.kdf.hash === 'SHA-256' &&
    typeof x.kdf.iterations === 'number' &&
    x.kdf.iterations > 0 &&
    typeof x.kdf.salt === 'string' &&
    x.cipher.name === 'AES-GCM' &&
    typeof x.cipher.iv === 'string' &&
    typeof x.data === 'string'
  )
}

const toBase64 = (bytes: Uint8Array): string => {
  let text = ''
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(text)
}

const fromBase64 = (text: string): Uint8Array<ArrayBuffer> => {
  const raw = atob(text)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

const through = async (bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) => {
  const body = new Response(bytes).body
  if (!body) throw new Error('Streams are not supported here.')
  return new Uint8Array(await new Response(body.pipeThrough(stream)).arrayBuffer())
}

const deriveKey = async (passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number) => {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase.normalize('NFC')), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ])
}

const headerBytes = (sealedAt: string) => new TextEncoder().encode(`${SEALED_BOOK_FORMAT}:${SEALED_BOOK_VERSION}:${sealedAt}`)

export async function sealBook(
  files: readonly BookFile[],
  passphrase: string,
  { iterations = DEFAULT_ITERATIONS, sealedAt = new Date().toISOString() }: { iterations?: number; sealedAt?: string } = {},
): Promise<SealedBook> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt, iterations)
  const plain = await through(new TextEncoder().encode(JSON.stringify({ files })), new CompressionStream('gzip'))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: headerBytes(sealedAt) }, key, plain)
  return {
    format: SEALED_BOOK_FORMAT,
    version: SEALED_BOOK_VERSION,
    sealedAt,
    fileCount: files.length,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: toBase64(salt) },
    cipher: { name: 'AES-GCM', iv: toBase64(iv) },
    data: toBase64(new Uint8Array(cipher)),
  }
}

/** When a book was sealed, for people to read. */
export const sealedDate = (book: SealedBook): string =>
  new Date(book.sealedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

/** The files in a sealed book. Throws BookUnlockError for a wrong passphrase. */
export async function openBook(book: SealedBook, passphrase: string): Promise<BookFile[]> {
  const key = await deriveKey(passphrase, fromBase64(book.kdf.salt), book.kdf.iterations)
  let plain: ArrayBuffer
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(book.cipher.iv), additionalData: headerBytes(book.sealedAt) },
      key,
      fromBase64(book.data),
    )
  } catch {
    throw new BookUnlockError()
  }
  const json: unknown = JSON.parse(new TextDecoder().decode(await through(new Uint8Array(plain), new DecompressionStream('gzip'))))
  if (!isRecord(json) || !Array.isArray(json.files)) throw new Error('The book data is not in the expected shape.')
  return json.files.filter((f): f is BookFile => isRecord(f) && typeof f.name === 'string' && typeof f.text === 'string')
}
