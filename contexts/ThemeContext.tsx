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

/* Dark obsidian cards → dirty white in light mode.
   Injected raw (not via globals.css) because Next.js' Lightning CSS does not
   apply these [style*="rgba(13,…)"] overrides from the compiled stylesheet,
   while a raw <style> works reliably. Gated by [data-theme="light"]. */
const LIGHT_CARD_FIX = `
[data-theme="light"] #dash-content [style*="rgba(13,10,31"],
[data-theme="light"] #dash-content [style*="rgba(13, 10, 31"],
[data-theme="light"] #dash-content [style*="rgba(13,8,41"],
[data-theme="light"] #dash-content [style*="rgba(13, 8, 41"],
[data-theme="light"] #dash-content [style*="rgba(16,9,44"],
[data-theme="light"] #dash-content [style*="rgba(22,12,61"],
[data-theme="light"] #dash-content [style*="#160C3D"],
[data-theme="light"] #dash-content [style*="#0D0829"],
[data-theme="light"] #dash-content [style*="#130E28"] {
  background: #F3F0FB !important;
  border-color: rgba(124,58,237,0.14) !important;
  box-shadow: 0 2px 14px rgba(80,40,160,0.07) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}`

function ensureCardFix() {
  if (document.getElementById('socime-light-card-fix')) return
  const el = document.createElement('style')
  el.id = 'socime-light-card-fix'
  el.textContent = LIGHT_CARD_FIX
  document.head.appendChild(el)
}

function apply(t: AppTheme) {
  document.documentElement.setAttribute('data-theme', t)
  document.body.style.background = t === 'dark' ? '#0D0829' : '#D4CCFF'
  ensureCardFix()
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
