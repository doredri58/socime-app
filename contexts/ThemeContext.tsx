'use client'
import { createContext, useContext, useEffect, ReactNode } from 'react'

/* SociMe runs a single, permanent light theme (the "airy glass" design).
   The dark/light toggle was removed — `useTheme` is kept only so existing
   consumers keep compiling; theme is always 'light' and toggle is a no-op. */

export type AppTheme = 'light'

interface ThemeCtx {
  theme: AppTheme
  toggle: () => void
  isDark: boolean
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', toggle: () => {}, isDark: false })

/* Dark obsidian/glass card surfaces (inline dark-theme styles left in the
   markup) → frosted white glass, so the whole app reads as the light design.
   Injected raw (not via globals.css) because Next.js' Lightning CSS does not
   apply these [style*="rgba(…)"] overrides from the compiled stylesheet. */
const LIGHT_CARD_FIX = `
[data-theme="light"] :is(#dash-content, .light-page) [style*="rgba(26,13,40"],
[data-theme="light"] :is(#dash-content, .light-page) [style*="rgba(26, 13, 40"],
[data-theme="light"] :is(#dash-content, .light-page) [style*="rgba(28,15,43"],
[data-theme="light"] :is(#dash-content, .light-page) [style*="rgba(28, 15, 43"],
[data-theme="light"] :is(#dash-content, .light-page) [style*="rgba(16,9,44"],
[data-theme="light"] :is(#dash-content, .light-page) [style*="rgba(22,12,61"],
[data-theme="light"] :is(#dash-content, .light-page) [style*="#20112F"],
[data-theme="light"] :is(#dash-content, .light-page) [style*="#1C0F2B"],
[data-theme="light"] :is(#dash-content, .light-page) [style*="#1E1030"] {
  background: rgba(255,255,255,0.55) !important;
  border-color: rgba(255,255,255,0.75) !important;
  box-shadow: 0 10px 34px rgba(84,60,150,0.14) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}`

function ensureCardFix() {
  if (document.getElementById('socime-light-card-fix')) return
  const el = document.createElement('style')
  el.id = 'socime-light-card-fix'
  el.textContent = LIGHT_CARD_FIX
  document.head.appendChild(el)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    ensureCardFix()
  }, [])

  return <Ctx.Provider value={{ theme: 'light', toggle: () => {}, isDark: false }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
