'use client'
import { useEffect } from 'react'

interface DrawerProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  {
    label: 'חבר Meta',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    label: 'פרופיל עסקי',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: 'ארנק טוקנים',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
      </svg>
    ),
  },
  {
    label: 'הגדרות',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
  },
]

export default function Drawer({ open, onClose }: DrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200] transition-opacity duration-300"
        style={{
          background: 'rgba(26,26,46,0.35)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <nav
        className="fixed top-0 right-0 h-full z-[201] flex flex-col bg-white"
        style={{
          width: 'min(340px, 88vw)',
          transform: open ? 'translateX(0)' : 'translateX(110%)',
          transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '-8px 0 48px rgba(161,70,255,0.14)',
          padding: '36px 32px',
        }}
        aria-label="תפריט ראשי"
      >
        <div className="text-2xl font-black mb-12" style={{ color: 'var(--purple)' }}>
          SociMe ✦
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-medium cursor-pointer transition-all duration-300 text-right"
              style={{ color: '#4A4A6A' }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'var(--purple-soft)'
                el.style.color = 'var(--purple)'
                el.style.boxShadow = 'var(--purple-glow-sm)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = ''
                el.style.color = '#4A4A6A'
                el.style.boxShadow = ''
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="pt-6 text-center text-xs" style={{ borderTop: '1px solid rgba(161,70,255,0.18)', color: '#8888A8' }}>
          SociMe v1.0 · בנוי עם ❤ בישראל
        </div>
      </nav>
    </>
  )
}
