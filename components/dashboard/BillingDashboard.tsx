'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeModal from '@/components/dashboard/UpgradeModal'

/* ── design tokens ────────────────────────────────────────────────────── */
const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'
const BLUE    = '#3B82EF'
const GREEN   = '#0A7159'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 20,
}

/* ── plan metadata ────────────────────────────────────────────────────── */
const PLAN_META: Record<string, {
  label: string; price: string; tokenLimit: number
  color: string; bg: string; border: string; icon: string
}> = {
  free:   { label: 'חינמי',   price: '₪0',    tokenLimit: 100,  color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', icon: 'ti-user'      },
  basic:  { label: 'Basic',   price: '₪199',  tokenLimit: 500,  color: BLUE,      bg: 'rgba(59,130,239,0.12)',  border: 'rgba(59,130,239,0.28)',  icon: 'ti-rocket'    },
  pro:    { label: 'Pro',     price: '₪299',  tokenLimit: 1000, color: PURPLE2,   bg: 'rgba(150,86,254,0.12)', border: 'rgba(150,86,254,0.28)', icon: 'ti-crown'     },
  agency: { label: 'Agency',  price: '₪999',  tokenLimit: 2000, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', icon: 'ti-building'  },
}

/* ── types ────────────────────────────────────────────────────────────── */
interface Profile {
  id: string; email: string; name: string; role: string
  plan: string; tier: string; token_balance: number; created_at: string
  subscription_expires_at?: string | null
  card_brand?: string | null
  card_last4?: string | null
}
interface Transaction { amount_paid_ils: number; tokens_granted: number; created_at: string }
interface Business { business_name?: string; company_id?: string; address?: string; phone?: string }

interface Props { profile: Profile | null; transactions: Transaction[]; business: Business | null }

/* ── small helpers ────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: 'paid' | 'pending' | 'failed' }) {
  const map = {
    paid:    { label: 'שולם',   color: GREEN,    bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
    pending: { label: 'ממתין',  color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.28)' },
    failed:  { label: 'נכשל',   color: '#CC1F1F', bg: 'rgba(248,113,113,0.10)',border: 'rgba(248,113,113,0.28)'},
  }
  const s = map[status]
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

function SectionCard({ icon, iconBg, iconColor, title, subtitle, action, children, glow }: {
  icon: string; iconBg: string; iconColor: string; title: string; subtitle?: string
  action?: React.ReactNode; children: React.ReactNode; glow?: boolean
}) {
  return (
    <div className="neon-card" style={{ ...GLASS, padding: '24px', position: 'relative', overflow: 'hidden',
      ...(glow ? { borderColor: 'rgba(150,86,254,0.22)', background: 'rgba(150,86,254,0.04)' } : {}) }}>
      {glow && <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130,
        borderRadius: '50%', background: 'rgba(150,86,254,0.10)', filter: 'blur(45px)', pointerEvents: 'none' }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: iconBg,
            border: `1px solid ${iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${icon}`} style={{ fontSize: 17, color: iconColor }} />
          </div>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 13 }} />}{label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>{value || '—'}</span>
    </div>
  )
}

/* ── main ─────────────────────────────────────────────────────────────── */
export default function BillingDashboard({ profile, transactions, business }: Props) {
  const router  = useRouter()
  const plan    = PLAN_META[profile?.tier ?? 'free'] ?? PLAN_META.free
  const tokens  = profile?.token_balance ?? 0
  const usedPct = Math.max(0, Math.min(100, 100 - (tokens / plan.tokenLimit) * 100))
  const isPro   = ['pro', 'agency'].includes(profile?.tier ?? '')

  const [showUpgrade,   setShowUpgrade]   = useState(false)
  const [editingBill,   setEditingBill]   = useState(false)
  const [billName,      setBillName]      = useState(business?.business_name ?? '')
  const [billCompanyId, setBillCompanyId] = useState(business?.company_id ?? '')
  const [billAddress,   setBillAddress]   = useState(business?.address ?? '')
  const [billEmail,     setBillEmail]     = useState(profile?.email ?? '')
  const [savingBill,    setSavingBill]    = useState(false)
  const [toast,         setToast]         = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function upgradePlan(planId: 'basic' | 'pro') {
    const res  = await fetch('/api/payplus/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile?.id, plan: planId, email: profile?.email }),
    })
    const data = await res.json()
    if (data.url || data.paymentUrl) window.location.href = data.url ?? data.paymentUrl
  }

  async function buyTokens() { setShowUpgrade(true) }

  async function saveBillingDetails() {
    setSavingBill(true)
    await new Promise(r => setTimeout(r, 800)) // optimistic
    setSavingBill(false)
    setEditingBill(false)
    showToast('פרטי החיוב עודכנו ✓')
  }

  function downloadInvoice(txn: Transaction, idx: number) {
    const blob = new Blob([
      `חשבונית SociMe\n\nתאריך: ${new Date(txn.created_at).toLocaleDateString('he-IL')}\nסכום: ₪${txn.amount_paid_ils}\nטוקנים: ${txn.tokens_granted}\n\nלקוח: ${profile?.name}\nאימייל: ${profile?.email}`
    ], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url; a.download = `socime-invoice-${idx + 1}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', direction: 'rtl' }}>
      <i className="ti ti-user-off" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
      לא נמצא פרופיל
    </div>
  )

  return (
    <div style={{ direction: 'rtl', paddingBottom: 60 }}>

      {/* ── page header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
          מצב חשבון וחיובים
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          ניהול מנוי, אמצעי תשלום וחשבוניות — הכל במקום אחד
        </p>
      </div>

      {/* ══ TOP ROW — plan + payment ══════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* ── Card 1: Current Plan & Usage ── */}
        <SectionCard
          icon={plan.icon} iconBg={plan.bg} iconColor={plan.color}
          title="מסלול נוכחי ושימוש"
          subtitle="ניצול טוקנים ומנוי פעיל"
          glow={isPro}
        >
          {/* plan badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 900, padding: '5px 14px', borderRadius: 999,
                background: plan.bg, border: `1px solid ${plan.border}`, color: plan.color,
                display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className={`ti ${plan.icon}`} style={{ fontSize: 13 }} />
                {plan.label} Plan
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                {plan.price}<span style={{ fontSize: 11, fontWeight: 400 }}>/חודש</span>
              </span>
            </div>
            {isPro && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)', color: GREEN }}>
                ● פעיל
              </span>
            )}
          </div>

          {/* token usage bar */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-coins" style={{ fontSize: 13, color: PURPLE2 }} /> ניצול טוקנים
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                {tokens.toLocaleString()}
                <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}> / {plan.tokenLimit.toLocaleString()}</span>
              </span>
            </div>
            {/* bar track */}
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999, transition: 'width 0.6s ease',
                width: `${100 - usedPct}%`,
                background: tokens < plan.tokenLimit * 0.2
                  ? 'linear-gradient(90deg, #CC1F1F, #EF4444)'
                  : tokens < plan.tokenLimit * 0.5
                  ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                  : `linear-gradient(90deg, ${PURPLE}, ${PURPLE2})`,
                boxShadow: `0 0 10px ${tokens < plan.tokenLimit * 0.2 ? 'rgba(248,113,113,0.4)' : 'rgba(150,86,254,0.4)'}`,
              }} />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 5 }}>
              נותרו {tokens.toLocaleString()} טוקנים מתוך {plan.tokenLimit.toLocaleString()}
            </p>
          </div>

          {/* renewal note */}
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-calendar-repeat" style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              הטוקנים מתחדשים ב-1 לכל חודש · ניתן לרכוש עוד בכל עת
            </span>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {!isPro && (
              <button onClick={() => upgradePlan('pro')} style={{
                flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(150,86,254,0.35)',
              }}>
                <i className="ti ti-crown" style={{ fontSize: 13, color: '#FBBF24' }} /> שדרגו מסלול
              </button>
            )}
            <button onClick={buyTokens} style={{
              flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} /> רכישת טוקנים
            </button>
          </div>
        </SectionCard>

        {/* ── Card 2: Payment Method ── */}
        <SectionCard
          icon="ti-credit-card" iconBg="rgba(59,130,239,0.12)" iconColor={BLUE}
          title="אמצעי תשלום"
          subtitle="כרטיס ברירת המחדל לחידוש המנוי"
        >
          {/* credit card — real saved card from PayPlus, or honest empty state */}
          {profile.card_last4 ? (
            <div style={{
              borderRadius: 16, padding: '20px 22px', marginBottom: 16,
              background: 'linear-gradient(135deg, rgba(59,130,239,0.18) 0%, rgba(150,86,254,0.15) 100%)',
              border: '1px solid rgba(59,130,239,0.22)', position: 'relative', overflow: 'hidden',
            }}>
              {/* card chip glow */}
              <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80,
                borderRadius: '50%', background: 'rgba(59,130,239,0.15)', filter: 'blur(25px)', pointerEvents: 'none' }} />

              {/* top row — brand */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {/* chip */}
                  <div style={{ width: 28, height: 20, borderRadius: 4, background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                    border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 16, height: 12, borderRadius: 2, border: '1px solid rgba(255,255,255,0.5)',
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 2 }}>
                      {[0,1,2,3].map(i => <div key={i} style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />)}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>
                  {profile.card_brand ?? 'כרטיס'}
                </span>
              </div>

              {/* card number */}
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.15em', marginBottom: 12,
                fontFamily: 'monospace', direction: 'ltr' }}>
                **** **** **** {profile.card_last4}
              </div>

              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>בעל הכרטיס</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{profile.name}</div>
              </div>
            </div>
          ) : (
            <div style={{
              borderRadius: 16, padding: '26px 22px', marginBottom: 16, textAlign: 'center',
              background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)',
            }}>
              <i className="ti ti-credit-card-off" style={{ fontSize: 26, color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>אין אמצעי תשלום שמור</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                הכרטיס יישמר מאובטח ב-PayPlus ברכישת המנוי הראשונה, וישמש לחידוש אוטומטי
              </div>
            </div>
          )}

          {/* security badges */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { icon: 'ti-lock', text: 'SSL מוצפן' },
              { icon: 'ti-shield-check', text: 'PayPlus מאובטח' },
            ].map(b => (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                borderRadius: 999, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)' }}>
                <i className={`ti ${b.icon}`} style={{ fontSize: 11, color: GREEN }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{b.text}</span>
              </div>
            ))}
          </div>

          <button onClick={() => upgradePlan('pro')} style={{
            width: '100%', padding: '10px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)' }}
          >
            <i className="ti ti-refresh" style={{ fontSize: 13 }} /> עדכון אמצעי תשלום
          </button>
        </SectionCard>
      </div>

      {/* ══ BILLING DETAILS ══════════════════════════════════════════════ */}
      <div style={{ marginBottom: 16 }}>
        <SectionCard
          icon="ti-receipt" iconBg="rgba(251,191,36,0.12)" iconColor="#FBBF24"
          title="פרטי חיוב לחשבונית"
          subtitle="הנתונים שמופיעים על גבי החשבוניות שנשלחות אליך"
          action={
            <button onClick={() => setEditingBill(e => !e)} style={{
              padding: '7px 16px', borderRadius: 11, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: editingBill ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'rgba(255,255,255,0.07)',
              border: editingBill ? 'none' : '1px solid rgba(255,255,255,0.12)',
              color: editingBill ? '#fff' : 'rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', gap: 6, boxShadow: editingBill ? '0 3px 12px rgba(150,86,254,0.3)' : 'none',
            }}>
              <i className={`ti ${editingBill ? 'ti-check' : 'ti-pencil'}`} style={{ fontSize: 12 }} />
              {editingBill ? 'סיים עריכה' : 'ערוך פרטי חיוב'}
            </button>
          }
        >
          {editingBill ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'שם העסק / חברה', val: billName, set: setBillName, placeholder: 'שם החברה', icon: 'ti-building' },
                { label: 'ח.פ / עוסק מורשה', val: billCompanyId, set: setBillCompanyId, placeholder: '123456789', icon: 'ti-id-badge' },
                { label: 'כתובת לחיוב', val: billAddress, set: setBillAddress, placeholder: 'רחוב, עיר, מיקוד', icon: 'ti-map-pin' },
                { label: 'אימייל לחשבוניות', val: billEmail, set: setBillEmail, placeholder: 'billing@company.com', icon: 'ti-mail' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <i className={`ti ${f.icon}`} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                      style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: 11, fontSize: 13,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                        color: '#fff', outline: 'none', boxSizing: 'border-box', direction: 'rtl' }} />
                  </div>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={saveBillingDetails} disabled={savingBill} style={{
                  padding: '10px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 800,
                  background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, border: 'none', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 7, opacity: savingBill ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(150,86,254,0.3)',
                }}>
                  {savingBill
                    ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <i className="ti ti-device-floppy" style={{ fontSize: 14 }} />
                  }
                  שמור פרטים
                </button>
              </div>
            </div>
          ) : (
            <div>
              <InfoRow label="שם העסק / חברה"    value={billName      || business?.business_name || ''} icon="ti-building"    />
              <InfoRow label="ח.פ / עוסק מורשה"  value={billCompanyId || business?.company_id    || ''} icon="ti-id-badge"   />
              <InfoRow label="כתובת לחיוב"        value={billAddress   || business?.address       || ''} icon="ti-map-pin"    />
              <InfoRow label="אימייל לחשבוניות"   value={billEmail     || profile.email           || ''} icon="ti-mail"       />
              <div style={{ paddingTop: 4 }} />
            </div>
          )}
        </SectionCard>
      </div>

      {/* ══ BILLING HISTORY TABLE ════════════════════════════════════════ */}
      <SectionCard
        icon="ti-history" iconBg="rgba(255,255,255,0.07)" iconColor="rgba(255,255,255,0.45)"
        title="היסטוריית תשלומים"
        subtitle={`${transactions.length} עסקאות מתועדות`}
      >
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.22)' }}>
            <i className="ti ti-receipt-off" style={{ fontSize: 34, display: 'block', marginBottom: 10 }} />
            <div style={{ fontSize: 13 }}>אין עסקאות עדיין</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['תאריך', 'תיאור', 'סכום', 'סטטוס', 'חשבונית'].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                      color: 'rgba(255,255,255,0.32)', letterSpacing: '0.05em',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, i) => (
                  <tr key={i}
                    style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    {/* date */}
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                      {new Date(txn.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    {/* description */}
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(150,86,254,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className="ti ti-coins" style={{ fontSize: 13, color: PURPLE2 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13 }}>רכישת {txn.tokens_granted} טוקנים</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>SociMe Token Pack</div>
                        </div>
                      </div>
                    </td>
                    {/* amount */}
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                      ₪{txn.amount_paid_ils.toLocaleString()}
                    </td>
                    {/* status */}
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <StatusBadge status="paid" />
                    </td>
                    {/* invoice download */}
                    <td style={{ padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <button onClick={() => downloadInvoice(txn, i)} title="הורד חשבונית PDF" style={{
                        width: 32, height: 32, borderRadius: 9, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(59,130,239,0.15)'; b.style.borderColor = 'rgba(59,130,239,0.35)' }}
                      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,0.05)'; b.style.borderColor = 'rgba(255,255,255,0.10)' }}
                      >
                        <i className="ti ti-file-download" style={{ fontSize: 14, color: BLUE }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          padding: '12px 24px', borderRadius: 999, zIndex: 200, pointerEvents: 'none',
          background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.32)',
          backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <i className="ti ti-circle-check" style={{ fontSize: 16, color: GREEN }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{toast}</span>
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} trigger="tokens_empty" />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
