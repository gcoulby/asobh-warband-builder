import type { ReactNode } from 'react'
import { PersistenceContext } from '@/hooks/persistence-context'
import { usePersistence } from '@/hooks/use-persistence'

export function PersistenceProvider({ children }: { children: ReactNode }) {
  const persistence = usePersistence()
  return <PersistenceContext value={persistence}>{children}</PersistenceContext>
}
