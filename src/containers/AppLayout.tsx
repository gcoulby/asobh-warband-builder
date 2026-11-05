import { Outlet } from 'react-router'
import { AppHeader } from '@/components/AppHeader'
import { StorageErrorBanner } from '@/components/StorageErrorBanner'
import { usePersistenceContext } from '@/hooks/persistence-context'
import { usePrefs } from '@/hooks/use-prefs'
import { useResolvedTheme } from '@/hooks/use-resolved-theme'

export function AppLayout() {
  const { status, error } = usePersistenceContext()
  const [prefs, setPrefs] = usePrefs()
  const resolved = useResolvedTheme()

  return (
    <div className="flex h-dvh flex-col print:block print:h-auto">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-background focus:p-3"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to content
      </a>
      <AppHeader
        status={status}
        theme={prefs.theme}
        resolvedTheme={resolved}
        onThemeChange={(theme) => setPrefs({ theme })}
      />
      {status === 'error' && error && <StorageErrorBanner message={error} />}
      <div id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none print:overflow-visible">
        <Outlet />
      </div>
    </div>
  )
}
