import type { ReactNode } from 'react'
import { useDataStore } from '@/stores/data-store'

/** Holds rendering until saved data has been read, so pages never flash empty. */
export function HydrationGate({ children }: { children: ReactNode }) {
  const hydrated = useDataStore((s) => s.hydrated)
  if (!hydrated) return <p className="sr-only" role="status">Loading saved warbands</p>
  return children
}
