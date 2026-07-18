'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import NotificationBell from './NotificationBell'
import BusinessSwitcher from './BusinessSwitcher'
import { useTheme } from '@/contexts/ThemeContext'

interface TopBarProps {
  userName: string
  tokens: number
  tier: string
}

const MAX_TOKENS: Record<string, number> = { free: 100, basic: 500, pro: 1000, agency: 2000 }

export default function TopBar({ userName, tokens, tier }: TopBarProps) {
  const { isDark } = useTheme()
  // Seed from the server prop, then live-refresh whenever tokens are spent.
  const [balance, setBalance] = useState(tokens)

  useEffect(() => {
    let active = true
    async function refresh() {
      try {
        const r = await fetch('/api/tokens/balance')
        if (!r.ok) return
        const d = await r.json()
        if (active && typeof d.balance === 'number') setBalance(d.balance)
      } catch { /* ignore */ }
    }
    // 'tokens-updated' is dispatched by generation call sites after a spend;
    // focus catches anything that happened on another tab/route.
    window.addEventListener('tokens-updated', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      active = false
      window.removeEventListener('tokens-updated', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const max = MAX_TOKENS[tier] ?? 100
  const pct = Math.min(Math.round((balance / max) * 100), 100)
  const tokenColor = pct > 50 ? '#BE56FE' : pct > 20 ? '#8A6207' : '#CC1F1F'

  return (
    <header className="dash-topbar" style={{
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

      {/* Right: active-business switcher (context switching) */}
      <div style={{ flex: 1 }}>
        <BusinessSwitcher />
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
          נותרו {balance.toLocaleString('he-IL')} טוקנים
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
        <Link href="/dashboard/profile" className="topbar-upgrade-mini" style={{
          fontSize: 10, fontWeight: 700, color: '#9656FE',
          textDecoration: 'none',
          padding: '3px 10px', borderRadius: 999,
          background: 'rgba(150,86,254,0.15)',
          border: '1px solid rgba(150,86,254,0.3)',
          whiteSpace: 'nowrap',
        }}>
          שדרוג
        </Link>
      </div>

      {/* Left: Notification + Avatar */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>

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
