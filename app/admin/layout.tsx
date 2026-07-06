import Link from 'next/link'
import Image from 'next/image'
import { requireAdmin } from '@/lib/admin'
import AdminSearchBar from '@/components/admin/AdminSearchBar'

/* ── design tokens — Google Cloud Console light theme ─────────────────── */
const ACCENT     = '#1A73E8'
const BG_PAGE    = '#F8FAFD'
const BG_SIDEBAR = '#FFFFFF'
const BD         = '#E2E8F0'
const TEXT       = '#0F172A'
const TEXT_MID   = '#475569'
const TEXT_LOW   = '#94A3B8'

const NAV: { href: string; icon: string; label: string; sub: string }[] = [
  { href: '/admin',         icon: 'ti-layout-dashboard', label: 'מבט על',        sub: 'Overview'         },
  { href: '/admin/leads',   icon: 'ti-inbox',            label: 'לידים',          sub: 'Landing Leads'    },
  { href: '/admin/users',   icon: 'ti-users-group',      label: 'ניהול לקוחות',   sub: 'Users & CRM'      },
  { href: '/admin/billing', icon: 'ti-credit-card',      label: 'ניהול מינויים',  sub: 'Billing & Stripe' },
  { href: '/admin/ai',      icon: 'ti-brain',            label: 'מנוע ה-AI',      sub: 'System Prompts'   },
  { href: '/admin/apis',    icon: 'ti-activity',         label: 'ניטור APIs',      sub: 'Data Sources'     },
  { href: '/admin/logs',    icon: 'ti-terminal-2',       label: 'לוגים ושגיאות',   sub: 'System Logs'      },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', background: BG_PAGE, fontFamily: 'Space Grotesk, sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: BG_SIDEBAR, borderLeft: `1px solid ${BD}`,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Image src="/logo.png" alt="SociMe" width={28} height={28} style={{ borderRadius: 8 }} />
            <span style={{ fontSize: 15, fontWeight: 900, color: TEXT, letterSpacing: '-0.5px' }}>
              Soci<span style={{ color: ACCENT }}>Me</span>
            </span>
          </div>
          {/* GOD MODE badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            borderRadius: 8, background: '#E8F0FE', border: '1px solid rgba(26,115,232,0.2)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: '#0F9E60',
              boxShadow: '0 0 6px #0F9E60', animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, letterSpacing: '0.1em' }}>
              GOD MODE
            </span>
          </div>
        </div>

        {/* nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 10, marginBottom: 2, textDecoration: 'none',
                color: '#5F6368', transition: 'all 0.15s',
              }}
              className="admin-nav-link"
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{item.label}</div>
                <div style={{ fontSize: 10, color: TEXT_LOW, letterSpacing: '0.02em' }}>{item.sub}</div>
              </div>
            </Link>
          ))}
        </nav>

        {/* admin identity */}
        <div style={{ padding: '14px', borderTop: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #1A73E8, #1557B0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, color: '#fff',
              border: '1.5px solid rgba(26,115,232,0.3)',
            }}>
              {(admin.name ?? 'A').charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {admin.name}
              </div>
              <div style={{ fontSize: 10, color: ACCENT }}>מייסד · Founder</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* top navbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 14,
          padding: '0 24px', height: 56,
          background: '#FFFFFF', borderBottom: `1px solid ${BD}`,
        }}>
          {/* global search */}
          <AdminSearchBar />

          {/* right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* system status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              background: 'rgba(15,158,96,0.08)', border: '1px solid rgba(15,158,96,0.2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0F9E60', boxShadow: '0 0 5px #0F9E60', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0F9E60' }}>All Systems OK</span>
            </div>

            {/* exit admin */}
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 9, textDecoration: 'none',
              background: 'rgba(217,48,37,0.06)', border: '1px solid rgba(217,48,37,0.18)',
              color: '#D93025', fontSize: 11, fontWeight: 800, letterSpacing: '0.02em',
              transition: 'all 0.15s',
            }}>
              <i className="ti ti-logout" style={{ fontSize: 13 }} />
              יציאה ממצב Admin
            </Link>
          </div>
        </header>

        {/* page content */}
        <main style={{ flex: 1, padding: '24px 28px', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .admin-nav-link:hover {
          background: #E8F0FE !important;
          color: #1A73E8 !important;
        }
        .admin-nav-link.active,
        .admin-nav-link[aria-current="page"] {
          background: #E8F0FE !important;
          color: #1A73E8 !important;
          border-right: 3px solid #1A73E8;
        }
      `}</style>
    </div>
  )
}
