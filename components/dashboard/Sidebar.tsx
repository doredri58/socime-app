'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',          label: 'סקירה',        icon: '📊' },
  { href: '/dashboard/business', label: 'תיק עסק',       icon: '🏢' },
  { href: '/dashboard/create',   label: 'יצירת תוכן',    icon: '✨' },
  { href: '/dashboard/queue',    label: 'תור פוסטים',    icon: '📅' },
]

interface SidebarProps {
  userName: string
  tier: string
  isAdmin?: boolean
}

const TIER_LABEL: Record<string, string> = { free: 'חינמי', basic: 'Basic', pro: 'Pro' }

export default function Sidebar({ userName, tier, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignout() {
    await fetch('/auth/signout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const navContent = (
    <>
      <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-8">
        <Image src="/logo.png" alt="SociMe" width={36} height={36} className="rounded-xl"
          style={{ boxShadow: '0 0 12px rgba(161,70,255,0.25)' }} />
        <span className="text-lg font-black" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
          Soci<span style={{ color: 'var(--purple)' }}>Me</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1.5 flex-1">
        {NAV.map(item => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active ? 'var(--purple-soft)' : 'transparent',
                color:      active ? 'var(--purple)' : 'var(--text-mid)',
                border:     active ? '1px solid var(--purple-border)' : '1px solid transparent',
              }}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        {isAdmin && (
          <Link href="/admin" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mt-2"
            style={{ background: '#1A1A2E', color: '#fff' }}>
            <span className="text-base">🛡️</span>
            ניהול מערכת
          </Link>
        )}
      </nav>

      <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--purple-border)' }}>
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))' }}>
            {userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: 'var(--text-dark)' }}>{userName}</div>
            <div className="text-xs" style={{ color: 'var(--purple)' }}>{TIER_LABEL[tier] ?? 'חינמי'}</div>
          </div>
        </div>
        <button onClick={handleSignout}
          className="w-full py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: '#FAFAFE', color: 'var(--text-mid)', border: '1px solid rgba(0,0,0,0.06)' }}>
          התנתק
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 right-4 z-50 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: '1px solid var(--purple-border)' }}>
        <span style={{ color: 'var(--purple)', fontSize: 20 }}>{open ? '✕' : '☰'}</span>
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 p-5"
        style={{ background: '#fff', borderLeft: '1px solid var(--purple-border)' }}>
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setOpen(false)} />
          <aside className="md:hidden fixed top-0 right-0 z-40 flex flex-col w-64 h-screen p-5"
            style={{ background: '#fff', borderLeft: '1px solid var(--purple-border)' }}>
            {navContent}
          </aside>
        </>
      )}
    </>
  )
}
