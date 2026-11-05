import { Link, NavLink } from 'react-router'
import { Swords } from 'lucide-react'
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
    <header className="border-b border-black/60 bg-card pt-[env(safe-area-inset-top)] shadow-[0_1px_0_0_rgb(255_255_255/0.03)] print:hidden">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-2 sm:px-4">
        <Link
          to="/"
          className="mr-1 hidden h-11 items-center gap-1.5 rounded-sm px-2 font-display text-lg font-bold tracking-tight sm:inline-flex"
        >
          <Swords className="size-5 text-primary" aria-hidden="true" />
          Warband Builder
        </Link>
        <span className="mr-1 hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
        <nav aria-label="Main" className="flex min-w-0 flex-1 items-center">
          <ul className="flex items-center">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex h-11 items-center rounded-sm px-2.5 font-display text-base font-semibold sm:text-lg text-muted-foreground hover:text-foreground',
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
