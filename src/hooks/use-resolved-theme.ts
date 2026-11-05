import { useEffect } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { usePrefs } from '@/hooks/use-prefs'

/** Applies the theme preference to the document and returns the theme in use. */
export function useResolvedTheme(): 'light' | 'dark' {
  const [{ theme }] = usePrefs()
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.style.colorScheme = resolved
  }, [resolved])

  return resolved
}
