import { NavLink } from 'react-router'
import { SaveStatus } from '@/components/SaveStatus'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { PersistenceStatus } from '@/hooks/use-persistence'
import type { ThemePref } from '@/hooks/use-prefs'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  status: PersistenceStatus
  theme: ThemePref
  resolvedTheme: 'light' | 'dark'
  onThemeChange: (theme: ThemePref) => void
}

const links = [
  { to: '/', label: 'Warbands', end: true },
  { to: '/library', label: 'Library', end: false },
  { to: '/rules', label: 'Rules', end: false },
] as const

export function AppHeader({ status, theme, resolvedTheme, onThemeChange }: AppHeaderProps) {
  return (
    <header className="border-b bg-background/95 pt-[env(safe-area-inset-top)] print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-2 sm:px-4">
        <nav aria-label="Main" className="flex min-w-0 flex-1 items-center">
          <ul className="flex items-center">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex h-11 items-center rounded-sm px-3 font-display text-lg font-semibold text-muted-foreground hover:text-foreground',
                      isActive && 'text-foreground underline decoration-brass-fill decoration-2 underline-offset-8',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <SaveStatus status={status} />
        <ThemeToggle value={theme} resolved={resolvedTheme} onChange={onThemeChange} />
      </div>
    </header>
  )
}
