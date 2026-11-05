import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { PersistenceProvider } from '@/components/PersistenceProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/containers/AppLayout'
import { HydrationGate } from '@/containers/HydrationGate'
import { useResolvedTheme } from '@/hooks/use-resolved-theme'
import { NotFoundPage } from '@/pages/NotFoundPage'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const WarbandPage = lazy(() => import('@/pages/WarbandPage').then((m) => ({ default: m.WarbandPage })))
const LibraryPage = lazy(() => import('@/pages/LibraryPage').then((m) => ({ default: m.LibraryPage })))
const RulesPage = lazy(() => import('@/pages/RulesPage').then((m) => ({ default: m.RulesPage })))
const PrintPage = lazy(() => import('@/pages/PrintPage').then((m) => ({ default: m.PrintPage })))
const SharedWarbandPage = lazy(() => import('@/pages/SharedWarbandPage').then((m) => ({ default: m.SharedWarbandPage })))

function App() {
  const theme = useResolvedTheme()

  return (
    <PersistenceProvider>
      <TooltipProvider>
        <HydrationGate>
          <HashRouter>
            <Suspense fallback={<p className="sr-only" role="status">Loading</p>}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="warband/:id" element={<WarbandPage />} />
                  <Route path="library" element={<LibraryPage />} />
                  <Route path="rules" element={<RulesPage />} />
                  <Route path="s/:payload" element={<SharedWarbandPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
                <Route path="print/:id" element={<PrintPage />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </HydrationGate>
        <Toaster theme={theme} position="top-center" />
      </TooltipProvider>
    </PersistenceProvider>
  )
}

export default App
