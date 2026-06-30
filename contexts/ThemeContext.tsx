'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type AppTheme = 'dark' | 'light'

interface ThemeCtx {
  theme: AppTheme
  toggle: () => void
  isDark: boolean
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {}, isDark: true })

const STORAGE_KEY = 'socime-theme'

function apply(t: AppTheme) {
  document.documentElement.setAttribute('data-theme', t)
  document.body.style.background = t === 'dark' ? '#0D0829' : '#D4CCFF'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as AppTheme | null)
    const initial: AppTheme = saved === 'light' || saved === 'dark' ? saved : 'dark'
    setTheme(initial)
    apply(initial)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next: AppTheme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      apply(next)
      return next
    })
  }

  return <Ctx.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
