'use client'
import Link from 'next/link'
import NotificationBell from './NotificationBell'
import { useTheme } from '@/contexts/ThemeContext'

interface TopBarProps {
  userName: string
  tokens: number
  tier: string
}

const MAX_TOKENS: Record<string, number> = { free: 100, basic: 500, pro: 2000 }

export default function TopBar({ userName, tokens, tier }: TopBarProps) {
  const { theme, toggle, isDark } = useTheme()
  const max = MAX_TOKENS[tier] ?? 100
  const pct = Math.min(Math.round((tokens / max) * 100), 100)
  const tokenColor = pct > 50 ? '#A78BFA' : pct > 20 ? '#FCD34D' : '#F87171'

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      height: 60,
      background: 'var(--dash-topbar-bg)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--dash-topbar-border)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px',
      direction: 'rtl',
      gap: 16,
    }}>

      {/* Right: Page context */}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dash-topbar-text)' }}>
          לוח בקרה
        </span>
      </div>

      {/* Center: Token tracker pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 18px', borderRadius: 999,
        background: 'var(--dash-token-bg)',
        border: '1px solid var(--dash-token-border)',
      }}>
        <i className="ti ti-coins" style={{ fontSize: 14, color: tokenColor }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--dash-token-text)', whiteSpace: 'nowrap' }}>
          נותרו {tokens.toLocaleString('he-IL')} טוקנים
        </span>
        <div style={{
          width: 56, height: 4, borderRadius: 99,
          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(109,40,217,0.12)',
          overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: 99,
            background: `linear-gradient(90deg, ${tokenColor}, ${tokenColor}aa)`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <Link href="/dashboard/profile" style={{
          fontSize: 10, fontWeight: 700, color: '#9850FF',
          textDecoration: 'none',
          padding: '3px 10px', borderRadius: 999,
          background: 'rgba(152,80,255,0.15)',
          border: '1px solid rgba(152,80,255,0.3)',
          whiteSpace: 'nowrap',
        }}>
          שדרוג
        </Link>
      </div>

      {/* Left: Theme toggle + Notification + Avatar */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>

        <button
          onClick={toggle}
          aria-label={isDark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}
          title={isDark ? 'מצב בהיר' : 'מצב כהה'}
          style={{
            width: 34, height: 34, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--dash-token-bg)',
            border: '1px solid var(--dash-token-border)',
            color: 'var(--dash-token-text)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <i className={`ti ${isDark ? 'ti-sun' : 'ti-moon-stars'}`} style={{ fontSize: 16 }} />
        </button>

        <NotificationBell />

        <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--dash-avatar-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff',
            boxShadow: `0 2px 10px var(--dash-avatar-shadow)`,
            cursor: 'pointer',
            userSelect: 'none',
          }}>
            {userName.charAt(0)}
          </div>
        </Link>
      </div>
    </header>
  )
}
