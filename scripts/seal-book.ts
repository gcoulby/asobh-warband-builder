/**
 * Seals a folder of source files into public/book.sealed.json, encrypted with a passphrase.
 *
 *   pnpm seal-book [folder]            folder defaults to .temp/sources
 *   pnpm seal-book --new-passphrase    seal with a passphrase other than the current file's
 *
 * The passphrase comes from BOOK_PASSPHRASE, or is asked for. When a sealed file
 * already exists, the passphrase must open it (so devices keep working), and
 * nothing is written when the files have not changed (so devices are not told
 * about an update that is not one).
 */
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { stdin, stdout } from 'node:process'
import {
  BookUnlockError,
  isSealedBook,
  openBook,
  sealBook,
  type BookFile,
  type SealedBook,
} from '../src/lib/sealed-book.ts'

const MIN_PASSPHRASE = 16
const OUT = path.resolve('public/book.sealed.json')

const args = process.argv.slice(2)
const newPassphrase = args.includes('--new-passphrase')
const folder = path.resolve(
  args.find((a) => !a.startsWith('--')) ?? '.temp/sources',
)

const fail = (message: string): never => {
  console.error(`\n${message}`)
  process.exit(1)
}

/** Asks a question without echoing the answer. */
const askHidden = (question: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true })
    const quiet = rl as unknown as { _writeToOutput: (s: string) => void }
    const write = quiet._writeToOutput.bind(rl)
    quiet._writeToOutput = (s) => {
      if (s.includes(question)) write(s)
    }
    rl.question(question, (answer) => {
      rl.close()
      stdout.write('\n')
      resolve(answer)
    })
  })

const readFolder = async (): Promise<BookFile[]> => {
  if (!existsSync(folder)) fail(`No folder at ${folder}.`)
  const names = (await readdir(folder))
    .filter((n) => n.toLowerCase().endsWith('.json'))
    .sort()
  if (names.length === 0) fail(`No JSON files in ${folder}.`)
  const files: BookFile[] = []
  const ids = new Map<string, string>()
  for (const name of names) {
    const text = await readFile(path.join(folder, name), 'utf8')
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      fail(`${name} is not valid JSON.`)
    }
    const source = (data as { source?: { id?: unknown } } | null)?.source
    const id = typeof source?.id === 'string' ? source.id : undefined
    if (id) {
      const other = ids.get(id)
      if (other)
        fail(
          `${other} and ${name} are both source "${id}". Remove or rename one so each source is sealed once.`,
        )
      ids.set(id, name)
    } else {
      console.warn(
        `  ${name} has no source id. It is sealed anyway; the app checks it when unlocking.`,
      )
    }
    files.push({ name, text })
  }
  return files
}

const sameFiles = (a: readonly BookFile[], b: readonly BookFile[]) =>
  a.length === b.length &&
  a.every((f, i) => f.name === b[i].name && f.text === b[i].text)

const files = await readFolder()
console.log(
  `Sealing ${files.length} files from ${path.relative(process.cwd(), folder) || '.'}:`,
)
files.forEach((f) => console.log(`  ${f.name}`))

const readExisting = async (): Promise<SealedBook | undefined> => {
  if (!existsSync(OUT)) return undefined
  const data: unknown = JSON.parse(await readFile(OUT, 'utf8'))
  return isSealedBook(data)
    ? data
    : fail(`${OUT} is not a sealed book. Move it out of the way first.`)
}
const existing = await readExisting()

let passphrase = process.env.BOOK_PASSPHRASE ?? ''
if (!passphrase) {
  passphrase = await askHidden('Passphrase: ')
  if (!existing || newPassphrase) {
    if ((await askHidden('Same again: ')) !== passphrase)
      fail('The passphrases do not match.')
  }
}
if (passphrase.length < MIN_PASSPHRASE) {
  fail(
    `Use a passphrase of at least ${MIN_PASSPHRASE} characters, such as four or five random words. The file is public, so a short one can be guessed.`,
  )
}

if (existing && !newPassphrase) {
  try {
    const current = await openBook(existing, passphrase)
    if (sameFiles(current, files)) {
      console.log(
        '\nNothing has changed since the last seal. The file is left as it is.',
      )
      process.exit(0)
    }
  } catch (e) {
    if (e instanceof BookUnlockError) {
      fail(
        'That passphrase does not open the current book.sealed.json. Use the same passphrase, or run with --new-passphrase to change it (every device will need the new one).',
      )
    }
    throw e
  }
}

const book = await sealBook(files, passphrase)
await writeFile(OUT, `${JSON.stringify(book)}\n`)
console.log(
  `\nWrote ${path.relative(process.cwd(), OUT)} (${Math.round(JSON.stringify(book).length / 1024)} KB), sealed ${book.sealedAt}.`,
)
console.log('Deploy it, then use Unlock book data, or Update, on each device.')
