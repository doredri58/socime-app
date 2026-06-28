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
  { href: '/dashboard/notifications', label: 'התראות',           icon: 'ti-bell' },
  { href: '/dashboard/profile',       label: 'פרופיל וחשבון',    icon: 'ti-user-circle' },
]

interface SidebarProps {
  userName: string
  tier: string
  isAdmin?: boolean
}

const TIER_LABEL: Record<string, { label: string; color: string }> = {
  free:  { label: 'חינמי', color: 'rgba(255,255,255,0.35)' },
  basic: { label: 'Basic', color: '#A78BFA' },
  pro:   { label: 'Pro ✦', color: '#C4B5FD' },
}

export default function Sidebar({ userName, tier, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen]   = useState(false)

  async function handleSignout() {
    await fetch('/auth/signout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const tierInfo = TIER_LABEL[tier] ?? TIER_LABEL.free

  const navContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <Link href="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 32, textDecoration: 'none',
        padding: '0 4px',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
        }}>
          <Image src="/logo.png" alt="SociMe" width={36} height={36}
            style={{ objectFit: 'cover' }} onError={() => {}} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1 }}>
            SociMe
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2 }}>
            AI Social
          </div>
        </div>
      </Link>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(139,92,246,0.15)', marginBottom: 16 }} />

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        {NAV.map(item => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                background: active ? 'rgba(139,92,246,0.2)' : 'transparent',
                borderRight: active ? '2px solid rgba(167,139,250,0.8)' : '2px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}>
              <i className={`ti ${item.icon}`}
                style={{ fontSize: 15, color: active ? '#C4B5FD' : 'rgba(255,255,255,0.4)' }}
                aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div style={{ height: 1, background: 'rgba(139,92,246,0.15)', margin: '10px 0' }} />
            <Link href="/admin" onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                color: '#F9A8D4',
                background: 'rgba(249,168,212,0.08)',
                borderRight: '2px solid transparent',
                textDecoration: 'none',
              }}>
              <i className="ti ti-shield-check" style={{ fontSize: 15, color: '#F9A8D4' }} aria-hidden="true" />
              ניהול מערכת
            </Link>
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid rgba(139,92,246,0.15)', paddingTop: 14, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
            boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
          }}>
            {userName.charAt(0)}
          </div>

          {/* Name + tier */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: tierInfo.color, fontWeight: 500 }}>
              {tierInfo.label}
            </div>
          </div>

          <NotificationBell />
        </div>

        <button onClick={handleSignout} style={{
          width: '100%', padding: '8px 0', borderRadius: 9,
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'all 0.15s ease',
        }}>
          התנתק
        </button>
      </div>
    </div>
  )

  const sidebarStyle = {
    background: 'var(--sidebar-gradient)',
    padding: '20px 14px',
    borderLeft: '1px solid rgba(139,92,246,0.12)',
  }

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
          border: 'none', cursor: 'pointer',
        }}>
        <i className={`ti ${open ? 'ti-x' : 'ti-menu-2'}`}
          style={{ fontSize: 18, color: '#fff' }} aria-hidden="true" />
      </button>

      {/* Desktop sidebar */}
      <aside className="dash-sidebar" style={{
        ...sidebarStyle,
        display: 'none',
        width: 220,
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}>
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(10,7,20,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)} />
          <aside className="md:hidden fixed top-0 right-0 z-40 flex flex-col w-56 h-screen"
            style={sidebarStyle}>
            {navContent}
          </aside>
        </>
      )}
    </>
  )
}
