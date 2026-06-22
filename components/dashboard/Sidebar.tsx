'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import NotificationBell from './NotificationBell'

const NAV = [
  { href: '/dashboard',               label: 'סקירה',           icon: 'ti-layout-dashboard' },
  { href: '/dashboard/business',      label: 'תיק עסק',          icon: 'ti-building-store' },
  { href: '/dashboard/create',        label: 'יצירת תוכן',       icon: 'ti-sparkles' },
  { href: '/dashboard/ideas',         label: 'בנק רעיונות',       icon: 'ti-bulb' },
  { href: '/dashboard/timing',        label: 'תזמון חכם',        icon: 'ti-clock' },
  { href: '/dashboard/bulk',          label: 'העלאת מדיה',       icon: 'ti-upload' },
  { href: '/dashboard/queue',         label: 'תור פוסטים',       icon: 'ti-calendar' },
  { href: '/dashboard/social',        label: 'רשתות חברתיות',    icon: 'ti-brand-instagram' },
  { href: '/dashboard/notifications', label: 'התראות Push',      icon: 'ti-bell' },
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, textDecoration: 'none' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <Image src="/logo.png" alt="SociMe" width={34} height={34} style={{ objectFit: 'cover' }}
            onError={() => {}} />
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
          SociMe
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV.map(item => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 11,
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.58)',
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s ease',
              }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}

        {isAdmin && (
          <Link href="/admin" onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 11, marginTop: 8,
              fontSize: 13, fontWeight: 600,
              color: '#fff', background: 'rgba(0,0,0,0.25)',
              textDecoration: 'none',
            }}>
            <i className="ti ti-shield" style={{ fontSize: 16 }} aria-hidden="true" />
            ניהול מערכת
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: 14, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {userName.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              {TIER_LABEL[tier] ?? 'חינמי'}
            </div>
          </div>
          <NotificationBell />
        </div>
        <button onClick={handleSignout}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 10,
            fontSize: 12, fontWeight: 500,
            background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
          }}>
          התנתק
        </button>
      </div>
    </div>
  )

    const sidebarBg = {
    background: 'var(--sidebar-gradient)',
    padding: '20px 16px',
  }

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 right-4 z-50 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--purple)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
        <i className={`ti ${open ? 'ti-x' : 'ti-menu-2'}`} style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />
      </button>

      {/* Desktop sidebar */}
      <aside className="dash-sidebar"
        style={{ ...sidebarBg, display: 'none', width: 224, minHeight: '100vh', position: 'sticky', top: 0, flexShrink: 0 }}>
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setOpen(false)} />
          <aside className="md:hidden fixed top-0 right-0 z-40 flex flex-col w-56 h-screen" style={sidebarBg}>
            {navContent}
          </aside>
        </>
      )}
    </>
  )
}
