import { useEffect, useMemo, useState } from 'react'
import { usePersistenceContext } from '@/hooks/persistence-context'

/**
 * Loads stored pictures and returns object URLs keyed by image id. URLs are
 * revoked when the ids change or the component unmounts.
 */
export function useImageUrls(imageIds: readonly (string | undefined)[]): ReadonlyMap<string, string> {
  const { getImage } = usePersistenceContext()
  const key = useMemo(
    () => [...new Set(imageIds.filter((id): id is string => Boolean(id)))].sort().join('|'),
    [imageIds],
  )
  const [urls, setUrls] = useState<ReadonlyMap<string, string>>(new Map())

  useEffect(() => {
    const ids = key ? key.split('|') : []
    let cancelled = false
    const created: string[] = []

    void Promise.all(
      ids.map(async (id) => {
        const blob = await getImage(id)
        if (!blob) return null
        const url = URL.createObjectURL(blob)
        created.push(url)
        return [id, url] as const
      }),
    ).then((pairs) => {
      if (cancelled) return
      setUrls(new Map(pairs.filter((p): p is readonly [string, string] => p !== null)))
    })

    return () => {
      cancelled = true
      created.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [key, getImage])

  return urls
}
