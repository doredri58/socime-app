'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

/* ── Nav structure ─────────────────────────────────────────── */

const WORKSPACE = [
  { href: '/dashboard',           label: 'דאשבורד',              icon: 'ti-layout-dashboard' },
  { href: '/dashboard/create',    label: 'סטודיו יצירה',         icon: 'ti-sparkles' },
  { href: '/dashboard/bulk',      label: 'העלאה מרוכזת',         icon: 'ti-files' },
  { href: '/dashboard/queue',     label: 'תזמונים ולוח שנה',     icon: 'ti-calendar-event' },
  { href: '/dashboard/timing',    label: 'תזמון חכם',             icon: 'ti-clock-bolt' },
  { href: '/dashboard/ideas',     label: 'ניתוחים סטטיסטיים',    icon: 'ti-chart-bar' },
  { href: '/dashboard/bank',      label: 'בנק רעיונות',           icon: 'ti-bulb' },
  { href: '/dashboard/community', label: 'ניהול קהילה',           icon: 'ti-message-2-heart' },
  { href: '/dashboard/business',  label: 'תיק עסק',              icon: 'ti-building-store' },
]

const MANAGEMENT = [
  { href: '/dashboard/profile',       label: 'מצב חשבון',        icon: 'ti-coins' },
  { href: '/dashboard/notifications', label: 'התראות',            icon: 'ti-bell' },
  { href: '/dashboard/social',        label: 'חיבורי רשתות',     icon: 'ti-plug-connected' },
  { href: '/dashboard/settings',      label: 'הגדרות',            icon: 'ti-settings' },
]

const SUPPORT = [
  { href: '/dashboard/help',     label: 'מרכז עזרה',            icon: 'ti-help-circle' },
  { href: '/dashboard/privacy',  label: 'מרכז הפרטיות',         icon: 'ti-shield-check' },
  { href: '/dashboard/terms',    label: 'תנאים ומדיניות',       icon: 'ti-file-description' },
]

/* ── Types ─────────────────────────────────────────────────── */

interface SidebarProps {
  userName: string
  tier: string
  isAdmin?: boolean
}

const TIER_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  free:  { label: 'חינמי', color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.07)' },
  basic: { label: 'Basic', color: '#A78BFA',                bg: 'rgba(167,139,250,0.12)' },
  pro:   { label: 'Pro ✦', color: '#BE56FF',                bg: 'rgba(190,86,255,0.15)'  },
}

/* ── Sub-components ────────────────────────────────────────── */

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '1.5px',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
      padding: '14px 12px 6px',
      userSelect: 'none',
    }}>
      {label}
    </div>
  )
}

function NavItem({
  href, label, icon, active, onClick, small,
}: {
  href: string; label: string; icon: string
  active: boolean; onClick?: () => void; small?: boolean
}) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: small ? '7px 12px' : '9px 12px',
      borderRadius: 10,
      fontSize: small ? 12 : 13,
      fontWeight: active ? 600 : 400,
      color: active ? '#fff' : 'rgba(255,255,255,0.52)',
      background: active ? 'rgba(152,80,255,0.18)' : 'transparent',
      borderRight: active ? '2px solid #9850FF' : '2px solid transparent',
      textDecoration: 'none',
      transition: 'background 0.15s, color 0.15s',
    }}>
      <i className={`ti ${icon}`} style={{
        fontSize: small ? 14 : 15, flexShrink: 0,
        color: active ? '#BE56FF' : 'rgba(255,255,255,0.35)',
      }} aria-hidden="true" />
      <span style={{ flex: 1 }}>{label}</span>
      {active && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#9850FF', flexShrink: 0,
          boxShadow: '0 0 6px rgba(152,80,255,0.8)',
        }} />
      )}
    </Link>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />
}

/* ── Main component ────────────────────────────────────────── */

export default function Sidebar({ userName, tier, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)

  function isActive(href: string) {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  async function handleSignout() {
    await fetch('/auth/signout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const tierInfo = TIER_BADGE[tier] ?? TIER_BADGE.free

  const content = (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <Link href="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 4px', marginBottom: 6,
        textDecoration: 'none', flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
          background: 'linear-gradient(135deg, #9850FF, #5B21B6)',
          boxShadow: '0 4px 14px rgba(152,80,255,0.45)',
        }}>
          <Image src="/logo.png" alt="SociMe" width={36} height={36}
            style={{ objectFit: 'cover' }} onError={() => {}} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1 }}>
            SociMe
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.8px', textTransform: 'uppercase', marginTop: 2 }}>
            AI Social
          </div>
        </div>
      </Link>

      <Divider />

      {/* ── Scrollable nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8 }}
        className="sidebar-scroll">

        {/* WORKSPACE */}
        <SectionLabel label="סביבת עבודה" />
        {WORKSPACE.map(item => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} onClick={() => setOpen(false)} />
        ))}

        <Divider />

        {/* MANAGEMENT */}
        <SectionLabel label="ניהול" />
        {MANAGEMENT.map(item => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} onClick={() => setOpen(false)} />
        ))}

        {/* Admin */}
        {isAdmin && (
          <>
            <Divider />
            <NavItem
              href="/admin" label="ניהול מערכת" icon="ti-shield-check"
              active={isActive('/admin')} onClick={() => setOpen(false)}
            />
          </>
        )}

        <Divider />

        {/* SUPPORT */}
        <SectionLabel label="תמיכה ומשפטי" />
        {SUPPORT.map(item => (
          <NavItem key={item.href} {...item} active={isActive(item.href)}
            onClick={() => setOpen(false)} small />
        ))}
      </nav>

      {/* ── User footer ── */}
      <div style={{ flexShrink: 0, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* User row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '10px 10px', borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          marginBottom: 8,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #9850FF, #5B21B6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
            boxShadow: '0 2px 8px rgba(152,80,255,0.4)',
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userName}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: tierInfo.color,
              background: tierInfo.bg,
              padding: '1px 7px', borderRadius: 999,
              display: 'inline-block', marginTop: 2,
            }}>
              {tierInfo.label}
            </span>
          </div>
          <Link href="/dashboard/profile" style={{
            color: 'rgba(255,255,255,0.3)', textDecoration: 'none',
            fontSize: 14, flexShrink: 0,
          }}>
            <i className="ti ti-settings" />
          </Link>
        </div>

        {/* Logout */}
        <button onClick={handleSignout} style={{
          width: '100%', padding: '8px', borderRadius: 9,
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          background: 'transparent',
          color: 'rgba(255,255,255,0.38)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'all 0.15s',
        }}>
          <i className="ti ti-logout" style={{ fontSize: 14 }} />
          התנתק
        </button>
      </div>
    </div>
  )

  const sidebarStyle: React.CSSProperties = {
    background: 'rgba(10,6,26,0.6)',
    backdropFilter: 'blur(24px)',
    borderLeft: '1px solid rgba(152,80,255,0.13)',
    padding: '20px 12px 16px',
    width: 220,
    flexShrink: 0,
  }

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(!open)}
        className="md:hidden fixed top-3 right-3 z-50 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #9850FF, #5B21B6)',
          boxShadow: '0 4px 14px rgba(152,80,255,0.45)',
          border: 'none', cursor: 'pointer',
        }}>
        <i className={`ti ${open ? 'ti-x' : 'ti-menu-2'}`}
          style={{ fontSize: 18, color: '#fff' }} aria-hidden="true" />
      </button>

      {/* Desktop */}
      <aside className="dash-sidebar" style={{
        ...sidebarStyle,
        display: 'none',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        maxHeight: '100vh',
      }}>
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(10,6,26,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)} />
          <aside className="md:hidden fixed top-0 right-0 z-50 flex flex-col w-56 h-screen"
            style={sidebarStyle}>
            {content}
          </aside>
        </>
      )}
    </>
  )
}
