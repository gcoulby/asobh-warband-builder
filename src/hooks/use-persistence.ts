import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createStore, del, get, set } from 'idb-keyval'
import { debounce } from '@/lib/debounce'
import { migrateStoredData } from '@/lib/migrate'
import { emptyStoredData, type Result, type StoredData } from '@/lib/schema'
import { newId, selectStoredData, useDataStore } from '@/stores/data-store'

export const DATA_KEY = 'asobh.data'
const WRITE_DELAY_MS = 400

export type PersistenceStatus = 'idle' | 'saving' | 'error'

export interface ImageStore {
  saveImage: (blob: Blob) => Promise<string>
  getImage: (id: string) => Promise<Blob | undefined>
  deleteImage: (id: string) => Promise<void>
}

export interface Persistence extends ImageStore {
  status: PersistenceStatus
  /** What went wrong, in words the user can act on. Set when status is `error`. */
  error?: string
  /** Last data load failed, so saving is paused to protect what is stored. */
  loadFailed: boolean
}

const imageDb = createStore('asobh-images', 'images')

const describeWriteError = (error: unknown): string =>
  error instanceof DOMException && error.name === 'QuotaExceededError'
    ? 'Browser storage is full. Export your warbands, then delete ones you no longer need.'
    : 'Changes could not be saved in this browser. Export your warbands to keep a copy.'

/**
 * Owns everything that is stored: warband data in localStorage and pictures in
 * IndexedDB. Data writes are debounced. Mount once, near the root.
 */
const paused = 'Saving is paused so nothing is overwritten.'

function readStoredData(): Result<StoredData> {
  let raw: unknown = null
  try {
    const text = localStorage.getItem(DATA_KEY)
    raw = text === null ? null : JSON.parse(text)
  } catch {
    return { ok: false, error: `Saved data could not be read. ${paused}` }
  }
  const migrated = migrateStoredData(raw)
  return migrated.ok ? migrated : { ok: false, error: `${migrated.error} ${paused}` }
}

export function usePersistence(): Persistence {
  const [initial] = useState(readStoredData)
  const [status, setStatus] = useState<PersistenceStatus>(initial.ok ? 'idle' : 'error')
  const [error, setError] = useState<string | undefined>(initial.ok ? undefined : initial.error)
  const loadFailed = !initial.ok
  const blockWrites = useRef(loadFailed)

  useEffect(() => {
    useDataStore.getState().hydrate(initial.ok ? initial.value : emptyStoredData())
  }, [initial])

  useEffect(() => {
    const writer = debounce(() => {
      if (blockWrites.current) return
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(selectStoredData(useDataStore.getState())))
        setStatus('idle')
        setError(undefined)
      } catch (e) {
        setStatus('error')
        setError(describeWriteError(e))
      }
    }, WRITE_DELAY_MS)

    const unsubscribe = useDataStore.subscribe((state, previous) => {
      if (!state.hydrated || !previous.hydrated || blockWrites.current) return
      if (
        state.warbands === previous.warbands &&
        state.models === previous.models &&
        state.rules === previous.rules
      ) {
        return
      }
      setStatus('saving')
      writer.schedule()
    })

    const flush = () => writer.flush()
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      unsubscribe()
      writer.flush()
    }
  }, [])

  const saveImage = useCallback(async (blob: Blob) => {
    const id = newId()
    try {
      await set(id, blob, imageDb)
      return id
    } catch (e) {
      setStatus('error')
      setError('The picture could not be saved. Browser storage may be full.')
      throw e
    }
  }, [])

  const getImage = useCallback(async (id: string) => {
    try {
      return await get<Blob>(id, imageDb)
    } catch {
      return undefined
    }
  }, [])

  const deleteImage = useCallback(async (id: string) => {
    try {
      await del(id, imageDb)
    } catch {
      // A picture left behind costs storage but loses nothing.
    }
  }, [])

  return useMemo(
    () => ({ status, error, loadFailed, saveImage, getImage, deleteImage }),
    [status, error, loadFailed, saveImage, getImage, deleteImage],
  )
}
