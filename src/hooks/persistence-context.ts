import { createContext, useContext } from 'react'
import type { Persistence } from '@/hooks/use-persistence'

export const PersistenceContext = createContext<Persistence | null>(null)

export function usePersistenceContext(): Persistence {
  const value = useContext(PersistenceContext)
  if (!value) throw new Error('usePersistenceContext must be used inside PersistenceProvider')
  return value
}
