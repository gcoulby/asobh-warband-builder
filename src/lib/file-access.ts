/**
 * Save and open files with the File System Access API where the browser has
 * it, falling back to a download link and a file input.
 */

export interface FilePickerType {
  description: string
  accept: Record<string, string[]>
}

interface WritableFile {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

interface SaveHandle {
  createWritable: () => Promise<WritableFile>
}

interface OpenHandle {
  getFile: () => Promise<File>
}

interface FilePickerWindow {
  showSaveFilePicker?: (options: { suggestedName: string; types: FilePickerType[] }) => Promise<SaveHandle>
  showOpenFilePicker?: (options: { types: FilePickerType[]; multiple: false }) => Promise<OpenHandle[]>
}

const pickerWindow = (): FilePickerWindow => window as unknown as FilePickerWindow

const isAbort = (error: unknown): boolean => error instanceof DOMException && error.name === 'AbortError'

export type SaveOutcome = 'saved' | 'downloaded' | 'cancelled'

export async function saveFile(blob: Blob, suggestedName: string, type: FilePickerType): Promise<SaveOutcome> {
  const picker = pickerWindow().showSaveFilePicker
  if (picker) {
    try {
      const handle = await picker({ suggestedName, types: [type] })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return 'saved'
    } catch (error) {
      if (isAbort(error)) return 'cancelled'
      throw error
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = suggestedName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}

export async function openFile(type: FilePickerType): Promise<File | null> {
  const picker = pickerWindow().showOpenFilePicker
  if (picker) {
    try {
      const [handle] = await picker({ types: [type], multiple: false })
      return handle ? await handle.getFile() : null
    } catch (error) {
      if (isAbort(error)) return null
      throw error
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = Object.entries(type.accept)
      .flatMap(([mime, exts]) => [mime, ...exts])
      .join(',')
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true })
    input.addEventListener('cancel', () => resolve(null), { once: true })
    input.click()
  })
}

export const zipFileType: FilePickerType = {
  description: 'Warband archive',
  accept: { 'application/zip': ['.zip'] },
}

export const jsonFileType: FilePickerType = {
  description: 'Rules file',
  accept: { 'application/json': ['.json'] },
}

export const pngFileType: FilePickerType = {
  description: 'PNG image',
  accept: { 'image/png': ['.png'] },
}

/** A file name made from free text, safe on every platform. */
export function fileNameFor(name: string, extension: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'warband'}.${extension}`
}
