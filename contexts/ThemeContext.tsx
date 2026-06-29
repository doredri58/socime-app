'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type AppTheme = 'dark' | 'light'

interface ThemeCtx {
  theme: AppTheme
  toggle: () => void
  isDark: boolean
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {}, isDark: true })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('socime-theme') as AppTheme) ?? 'dark'
    apply(saved)
    setTheme(saved)
  }, [])

  function apply(t: AppTheme) {
    document.documentElement.setAttribute('data-theme', t)
    document.body.style.background = t === 'dark' ? '#0D0829' : '#F0F2FF'
  }

  function toggle() {
    setTheme(prev => {
      const next: AppTheme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('socime-theme', next)
      apply(next)
      return next
    })
  }

  return <Ctx.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
