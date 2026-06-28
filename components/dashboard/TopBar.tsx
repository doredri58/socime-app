'use client'
import Link from 'next/link'
import NotificationBell from './NotificationBell'

interface TopBarProps {
  userName: string
  tokens: number
  tier: string
}

const MAX_TOKENS: Record<string, number> = { free: 100, basic: 500, pro: 2000 }

export default function TopBar({ userName, tokens, tier }: TopBarProps) {
  const max = MAX_TOKENS[tier] ?? 100
  const pct = Math.min(Math.round((tokens / max) * 100), 100)
  const tokenColor = pct > 50 ? '#A78BFA' : pct > 20 ? '#FCD34D' : '#F87171'

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      height: 60,
      background: 'rgba(13,8,41,0.85)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(152,80,255,0.18)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px',
      direction: 'rtl',
      gap: 16,
    }}>

      {/* Right: Page context (RTL = right = "start") */}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
          לוח בקרה
        </span>
      </div>

      {/* Center: Token tracker pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 18px', borderRadius: 999,
        background: 'rgba(167,139,250,0.08)',
        border: '1px solid rgba(167,139,250,0.22)',
      }}>
        <i className="ti ti-coins" style={{ fontSize: 14, color: tokenColor }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
          נותרו {tokens.toLocaleString('he-IL')} טוקנים
        </span>
        {/* mini progress bar */}
        <div style={{
          width: 56, height: 4, borderRadius: 99,
          background: 'rgba(255,255,255,0.1)', overflow: 'hidden', flexShrink: 0,
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

      {/* Left: Notification + Avatar (RTL: left = visually on the left) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
        <NotificationBell />
        <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #9850FF, #5B21B6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff',
            boxShadow: '0 2px 10px rgba(152,80,255,0.45)',
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
