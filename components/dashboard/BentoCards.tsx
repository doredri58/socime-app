'use client'
import Link from 'next/link'

interface QuickAction {
  href: string
  icon: string
  label: string
  desc: string
  color: string
  bg: string
}

interface FeatureCard {
  icon: string
  label: string
  cta: string
  href: string
  color: string
  desc: string
}

export function QuickActionList({ actions }: { actions: QuickAction[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
        פעולות מהירות
      </p>
      {actions.map(a => (
        <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 16,
            background: 'rgba(13,10,31,0.7)',
            border: '1px solid rgba(139,92,246,0.12)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.18s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'rgba(139,92,246,0.35)'
            el.style.transform = 'translateX(-3px)'
            el.style.boxShadow = '0 4px 24px rgba(109,40,217,0.15)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'rgba(139,92,246,0.12)'
            el.style.transform = ''
            el.style.boxShadow = ''
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${a.icon}`} style={{ fontSize: 16, color: a.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{a.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.desc}</div>
            </div>
            <i className="ti ti-chevron-left" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }} />
          </div>
        </Link>
      ))}
    </div>
  )
}

export function FeatureGrid({ items }: { items: FeatureCard[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {items.map(item => (
        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
          <div style={{
            borderRadius: 20, padding: '18px 20px',
            background: 'rgba(13,10,31,0.6)',
            border: '1px solid rgba(139,92,246,0.1)',
            backdropFilter: 'blur(10px)',
            height: '100%',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'rgba(139,92,246,0.3)'
            el.style.transform = 'translateY(-3px)'
            el.style.boxShadow = '0 8px 32px rgba(109,40,217,0.18)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'rgba(139,92,246,0.1)'
            el.style.transform = ''
            el.style.boxShadow = ''
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, marginBottom: 12, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 18, color: item.color }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 14 }}>{item.desc}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: item.color }}>
              {item.cta} <i className="ti ti-arrow-left" style={{ fontSize: 10 }} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
