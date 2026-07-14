'use client'
import { useState } from 'react'

/* ════════════════════════════════════════════════════════════════
   SociMe — Pricing Plans
   Dark charcoal · neon purple actions · gold crowns for Pro-locked.
   Transparent paywall: Basic users SEE Pro features (locked) → FOMO.
   Toggle defaults to ANNUAL. All copy Hebrew RTL.
════════════════════════════════════════════════════════════════ */

/* ── Theme tokens ───────────────────────────────────────────── */
const PURPLE = '#9656FE'
const GOLD = '#FFD700'

/* ── Token economy (shown as a small strip) ─────────────────── */
// מסונכרן עם lib/tokens.ts (TOKEN_COSTS)
const TOKEN_COSTS = [
  { icon: 'ti-video', label: 'וידאו', cost: 10 },
  { icon: 'ti-photo', label: 'תמונה', cost: 25 },
  { icon: 'ti-pencil', label: 'פוסט', cost: 10 },
]

/* ── Plan data ──────────────────────────────────────────────── */
type Feature = { label: string; included: boolean; locked?: boolean; pro?: boolean }

interface Plan {
  id: 'basic' | 'pro' | 'agency'
  name: string
  tagline: string
  monthly: number
  annual: number        // per-month price when billed annually
  annualTotal: number   // full yearly charge
  tokens: string
  highlight: boolean
  cta: string
  features: Feature[]
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'נקודת הכניסה',
    monthly: 199,
    annual: 159,
    annualTotal: 1908,
    tokens: '500',
    highlight: false,
    cta: 'התחילו עם Basic',
    features: [
      { label: 'ניהול עסק אחד', included: true },
      { label: '500 טוקנים בחודש', included: true },
      { label: 'יצירת וידאו ב-720p', included: true },
      { label: 'סוכני AI בסיסיים — יצירת תוכן וניהול קהילה', included: true },
      // Visible but locked (transparent paywall) →
      { label: 'וידאו 1080p + סאונדים ויראליים', included: false, locked: true },
      { label: 'סוכן ניתוח מתחרים', included: false, locked: true },
      { label: 'סוכן קופירייטינג לפרסום ממומן', included: false, locked: true },
      { label: 'מתאם רב-פלטפורמות', included: false, locked: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'הבחירה המשתלמת',
    monthly: 299,
    annual: 239,
    annualTotal: 2868,
    tokens: '1,000',
    highlight: true,
    cta: 'שדרגו ל-Pro',
    features: [
      { label: 'ניהול עסק אחד', included: true },
      { label: '1,000 טוקנים בחודש', included: true },
      { label: 'רינדור מהיר בעדיפות (Priority)', included: true },
      { label: 'וידאו 1080p + סאונדים ויראליים (TikTok/Reels)', included: true },
      { label: 'סוכן ניתוח מתחרים — סורק פרופילי מתחרים ובונה אסטרטגיית נגד', included: true, pro: true },
      { label: 'סוכן קופירייטינג לממומן — קופי אגרסיבי וממיר למודעות פייסבוק/גוגל', included: true, pro: true },
      { label: 'מתאם רב-פלטפורמות — 4 גרסאות מותאמות בו-זמנית', included: true, pro: true },
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'עוצמה לסוכנויות',
    monthly: 999,
    annual: 799,
    annualTotal: 9588,
    tokens: '2,000',
    highlight: false,
    cta: 'בחרו ב-Agency',
    features: [
      { label: 'כל מה שכלול ב-Pro', included: true },
      { label: '2,000 טוקנים בבנק סוכנות מרכזי', included: true },
      { label: 'ניהול עד 5 עסקים (פורטל לקוחות)', included: true },
      { label: 'מעבר הקשר מיידי בין לקוחות מתפריט עליון', included: true },
      { label: 'תוספת צמיחה: 79 ₪ לכל עסק נוסף (+100 טוקנים)', included: true },
    ],
  },
]

/* ── Helpers ────────────────────────────────────────────────── */
const ils = (n: number) => n.toLocaleString('he-IL')

type Billing = 'annual' | 'monthly'

/* ════════════════════════════════════════════════════════════════
   Upgrade-to-Pro modal (skeleton)
   Triggered when a Basic user clicks a gold-crown locked feature.
════════════════════════════════════════════════════════════════ */
function UpgradeModal({ open, feature, onClose }: { open: boolean; feature: string; onClose: () => void }) {
  if (!open) return null

  const proPerks = [
    'וידאו 1080p עם סאונדים ויראליים',
    'סוכן ניתוח מתחרים',
    'סוכן קופירייטינג לפרסום ממומן',
    'מתאם רב-פלטפורמות (4 גרסאות בו-זמנית)',
  ]

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-[#9656FE]/40 bg-[#14101D] p-8 text-right shadow-[0_0_60px_rgba(150,86,254,0.35)]"
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="סגירה"
          className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#857FA6] transition hover:bg-white/10 hover:text-[#253A53]"
        >
          <i className="ti ti-x text-lg" />
        </button>

        {/* Gold crown badge */}
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `${GOLD}1A` }}>
          <i className="ti ti-crown text-3xl" style={{ color: GOLD }} />
        </div>

        <h3 className="mb-2 text-center text-2xl font-extrabold text-white">פיצ׳ר של Pro</h3>
        <p className="mb-6 text-center text-sm leading-relaxed text-[#5B5878]">
          <span className="font-bold text-white">{feature}</span> זמין רק במסלול Pro.
          שדרגו עכשיו ותקבלו גישה מלאה לכל סוכני ה-AI המתקדמים.
        </p>

        {/* Pro perks */}
        <ul className="mb-7 space-y-2.5">
          {proPerks.map(p => (
            <li key={p} className="flex items-center gap-3 text-sm text-[#5B5878]">
              <i className="ti ti-circle-check text-lg" style={{ color: PURPLE }} />
              {p}
            </li>
          ))}
        </ul>

        {/* CTA — wire to checkout / PayPlus */}
        <button
          className="w-full rounded-full py-3.5 text-base font-extrabold text-white shadow-[0_8px_30px_rgba(150,86,254,0.5)] transition hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${PURPLE}, #6D28D9)` }}
          onClick={onClose}
        >
          שדרגו ל-Pro · 239 ₪/לחודש
        </button>
        <p className="mt-3 text-center text-xs text-[#A79FC4]">14 ימי ניסיון · ביטול בכל עת</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Billing toggle (defaults to Annual) — the 20% saving is written on
   the annual option itself, glass-styled per the design system.
════════════════════════════════════════════════════════════════ */
function BillingToggle({ billing, onChange }: { billing: Billing; onChange: (b: Billing) => void }) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full p-1"
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.13)',
      }}
    >
      <button
        onClick={() => onChange('annual')}
        className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${billing === 'annual' ? 'text-white' : 'text-[#857FA6] hover:text-[#5B5878]'
          }`}
        style={billing === 'annual' ? { background: PURPLE, boxShadow: '0 4px 18px rgba(150,86,254,0.45)' } : undefined}
      >
        שנתי · חסכו 20%
      </button>
      <button
        onClick={() => onChange('monthly')}
        className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${billing === 'monthly' ? 'text-white' : 'text-[#857FA6] hover:text-[#5B5878]'
          }`}
        style={billing === 'monthly' ? { background: PURPLE, boxShadow: '0 4px 18px rgba(150,86,254,0.45)' } : undefined}
      >
        חודשי
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Single feature row — included ✓ / Pro ✦ / gold-crown locked 👑
════════════════════════════════════════════════════════════════ */
function FeatureRow({ feature, onLockedClick }: { feature: Feature; onLockedClick: (label: string) => void }) {
  // Locked feature → clickable, opens upgrade modal
  if (feature.locked) {
    return (
      <button
        onClick={() => onLockedClick(feature.label)}
        className="group flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-right transition hover:bg-[rgba(120,90,200,0.06)]"
      >
        <i className="ti ti-crown shrink-0 text-base" style={{ color: GOLD }} />
        <span className="flex-1 text-sm text-[#857FA6] group-hover:text-[#5B5878]">{feature.label}</span>
        <span className="shrink-0 text-[10px] font-bold" style={{ color: GOLD }}>PRO</span>
      </button>
    )
  }

  // Pro-exclusive (highlighted on the Pro card)
  if (feature.pro) {
    return (
      <div className="flex items-start gap-3 px-1 py-1.5">
        <i className="ti ti-sparkles mt-0.5 shrink-0 text-base" style={{ color: PURPLE }} />
        <span className="flex-1 text-sm font-medium text-[#253A53]">{feature.label}</span>
      </div>
    )
  }

  // Standard included
  return (
    <div className="flex items-start gap-3 px-1 py-1.5">
      <i className="ti ti-check mt-0.5 shrink-0 text-base" style={{ color: PURPLE }} />
      <span className="flex-1 text-sm text-[#5B5878]">{feature.label}</span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Plan card
════════════════════════════════════════════════════════════════ */
function PlanCard({ plan, billing, busy, onSelect, onLockedClick }: {
  plan: Plan; billing: Billing; busy: boolean
  onSelect: (id: Plan['id']) => void
  onLockedClick: (l: string) => void
}) {
  const price = billing === 'annual' ? plan.annual : plan.monthly
  const highlight = plan.highlight

  return (
    <div
      className={`neon-card relative flex flex-col rounded-3xl p-7 transition ${highlight ? 'shadow-[0_0_50px_rgba(150,86,254,0.25)] md:-mt-4 md:mb-4' : ''
        }`}
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: highlight ? '1px solid rgba(150,86,254,0.6)' : '1px solid rgba(255,255,255,0.13)',
      }}
    >
      {/* "Best value" ribbon */}
      {highlight && (
        <span
          className="absolute right-1/2 top-0 -translate-y-1/2 translate-x-1/2 rounded-full px-4 py-1 text-xs font-extrabold text-white shadow-[0_4px_20px_rgba(150,86,254,0.6)]"
          style={{ background: PURPLE }}
        >
          הכי משתלם ✦
        </span>
      )}

      {/* Header */}
      <div className="mb-5">
        <h3 className="text-xl font-extrabold text-[#253A53]">{plan.name}</h3>
        <p className="mt-0.5 text-xs text-[#857FA6]">{plan.tagline}</p>
      </div>

      {/* Price (anchoring) */}
      <div className="mb-1 flex items-end gap-1.5">
        <span className="text-5xl font-black leading-none text-[#253A53]">{ils(price)} ₪</span>
        <span className="mb-1 text-sm text-[#857FA6]">/לחודש</span>
      </div>
      {billing === 'annual' ? (
        <p className="mb-5 text-xs text-[#857FA6]">בחיוב שנתי {ils(plan.annualTotal)} ₪</p>
      ) : (
        <p className="mb-5 text-xs text-[#857FA6]">חיוב חודשי · ללא התחייבות</p>
      )}

      {/* Tokens pill */}
      <div
        className="mb-6 inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5"
        style={{ background: `${PURPLE}1A`, border: `1px solid ${PURPLE}40` }}
      >
        <i className="ti ti-coins text-sm" style={{ color: '#C4B5FD' }} />
        <span className="text-xs font-bold text-[#253A53]">{plan.tokens} טוקנים בחודש</span>
      </div>

      {/* CTA */}
      <button
        onClick={() => onSelect(plan.id)}
        disabled={busy}
        className={`mb-6 w-full rounded-full py-3 text-sm font-extrabold transition hover:brightness-110 disabled:opacity-60 ${highlight ? 'text-white shadow-[0_8px_30px_rgba(150,86,254,0.5)]' : 'text-[#253A53]'
          }`}
        style={
          highlight
            ? { background: `linear-gradient(135deg, ${PURPLE}, #6D28D9)` }
            : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }
        }
      >
        {busy ? 'מעבירים לתשלום…' : plan.cta}
      </button>

      {/* Features */}
      <div className="space-y-0.5 border-t border-[rgba(120,90,200,0.14)] pt-5">
        {plan.features.map(f => (
          <FeatureRow key={f.label} feature={f} onLockedClick={onLockedClick} />
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Refund & cancellation policy (accordion) — binding Hebrew text
════════════════════════════════════════════════════════════════ */
function RefundPolicy() {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="mx-auto mt-12 max-w-2xl rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right"
      >
        <span className="flex items-center gap-2.5 text-sm font-bold text-white">
          <i className="ti ti-shield-check text-base" style={{ color: PURPLE }} />
          מדיניות החזרים וביטולים
        </span>
        <i className={`ti ti-chevron-down text-[#857FA6] transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-[rgba(120,90,200,0.14)] px-5 py-5 text-sm leading-relaxed text-[#5B5878]">
          <p>
            <span className="font-bold text-[#253A53]">אחריות 14 ימים — </span>
            במהלך 14 הימים הראשונים ממועד הרכישה ניתן לקבל החזר כספי מלא, ללא צורך בנימוק.
          </p>
          <p>
            <span className="font-bold text-[#253A53]">ללא החזר יחסי — </span>
            לאחר תום 14 הימים הראשונים, מנויים שנתיים אינם ניתנים להחזר כספי ואינם מחושבים באופן יחסי (pro-rata).
            ניתן לבטל את חידוש המנוי בכל עת, והחשבון יישאר פעיל ויעניק גישה מלאה עד לתום תקופת החיוב הנוכחית ששולמה.
          </p>
          <p className="text-xs text-[#A79FC4]">
            הרכישה כפופה לתנאי השימוש ולמדיניות הפרטיות של SociMe. החיובים מבוצעים בשקלים חדשים (₪).
          </p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   MAIN — Pricing page
════════════════════════════════════════════════════════════════ */
/* variant 'page' → standalone dark page (dashboard). 'section' → embed on the
   landing (transparent, sits on the landing's own dark gradient). */
export default function PricingPlans({ variant = 'page' }: { variant?: 'page' | 'section' }) {
  const [billing, setBilling] = useState<Billing>('annual')   // ← defaults to Annual
  const [modal, setModal] = useState<{ open: boolean; feature: string }>({ open: false, feature: '' })
  const [busy, setBusy] = useState<string | null>(null)

  const openUpgrade = (feature: string) => setModal({ open: true, feature })

  // Create a PayPlus payment page and redirect. Logged-out users → register first.
  async function checkout(planId: Plan['id']) {
    setBusy(planId)
    try {
      const res = await fetch('/api/payplus/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billing }),
      })
      if (res.status === 401) {
        window.location.href = `/login?mode=register&plan=${planId}&billing=${billing}`
        return
      }
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl
        return
      }
      alert(data.error ?? 'שגיאה ביצירת דף תשלום, נסו שוב.')
    } catch {
      alert('שגיאת רשת — נסו שוב.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section
      dir="rtl"
      className={`text-[#253A53] ${variant === 'page' ? 'light-page min-h-screen px-5 py-16' : 'px-5 py-16'}`}
      style={variant === 'page' ? { background: 'radial-gradient(ellipse at 20% 0%, rgba(190,86,254,.22) 0%, transparent 55%), linear-gradient(152deg,#E9DEFB 0%,#DCD6F7 45%,#CCE0FF 100%)' } : undefined}
    >
      <div className="mx-auto max-w-6xl">

        {/* ── Heading ── */}
        <div className="mb-10 text-center">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold"
            style={{ background: `${PURPLE}1F`, color: '#7C3FD6', border: `1px solid ${PURPLE}4D` }}
          >
            מחירים
          </div>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">בחרו את הקצב שלכם.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#857FA6]">
            כל המסלולים כוללים את מנוע ה-AI המלא. שדרגו או בטלו מתי שתרצו.
          </p>
        </div>

        {/* ── Toggle ── */}
        <div className="mb-12 flex justify-center">
          <BillingToggle billing={billing} onChange={setBilling} />
        </div>

        {/* ── Plan cards ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              busy={busy === plan.id}
              onSelect={checkout}
              onLockedClick={openUpgrade}
            />
          ))}
        </div>

        {/* ── Token economy strip ── */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A79FC4]">עלות בטוקנים</span>
          {TOKEN_COSTS.map(t => (
            <div key={t.label} className="flex items-center gap-2 text-sm text-[#5B5878]">
              <i className={`ti ${t.icon} text-base`} style={{ color: PURPLE }} />
              {t.label}
              <span className="font-bold text-white">{t.cost}</span>
            </div>
          ))}
        </div>

        {/* ── Refund policy ── */}
        <RefundPolicy />
      </div>

      {/* ── Upgrade modal ── */}
      <UpgradeModal open={modal.open} feature={modal.feature} onClose={() => setModal({ open: false, feature: '' })} />
    </section>
  )
}
