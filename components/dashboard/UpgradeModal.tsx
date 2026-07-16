'use client'
import { useState } from 'react'

const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'
const BLUE    = '#3B82EF'

const TRIGGER_COPY: Record<string, { title: string; subtitle: string }> = {
  image_limit:    { title: 'הגעתם למכסת התמונות החודשית',   subtitle: 'Basic נותן 30 תמונות בחודש, Pro נותן 100 — ופי 2 טוקנים' },
  smart_schedule: { title: 'שעות חכמות זמינות ב-Pro',        subtitle: 'היא מזהה את שעת השיא לכל רשת ומתזמנת אליה לבד' },
  tokens_empty:   { title: 'נגמרו לכם הטוקנים',              subtitle: 'שדרגו ל-Pro ל-1,000 טוקנים בחודש — פי 2 מ-Basic' },
  generic:        { title: 'הפיצ\'ר הזה זמין ב-Pro',         subtitle: 'שדרגו ופתחו את כל הסוכנים' },
}

/* Every line here has to survive the user checking it against the pricing page
   a minute later. Plan facts live in components/pricing/PricingPlans.tsx and
   token costs in lib/tokens.ts — keep this list in step with both. */
const PLAN_FEATURES = [
  { icon: 'ti-coins',            text: '1,000 טוקנים בחודש — פי 2 מ-Basic' },
  { icon: 'ti-video',            text: 'וידאו 1080p + סאונדים ויראליים' },
  { icon: 'ti-binoculars',       text: 'סוכן ניתוח מתחרים — סורק אותם ובונה אסטרטגיית נגד' },
  { icon: 'ti-coin',             text: 'סוכן קופירייטינג למודעות ממומנות' },
  { icon: 'ti-brain',            text: 'מתאם רב-פלטפורמות — 4 גרסאות בו-זמנית' },
  { icon: 'ti-bolt',             text: 'רינדור בעדיפות — אתם ראשונים בתור' },
]

interface Props {
  onClose: () => void
  trigger?: string
}

export default function UpgradeModal({ onClose, trigger = 'generic' }: Props) {
  const [loading, setLoading] = useState(false)
  const copy = TRIGGER_COPY[trigger] ?? TRIGGER_COPY.generic

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/payplus/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'pro' }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.url) window.location.href = data.url
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 740, direction: 'rtl',
          background: 'rgba(16,9,44,0.98)',
          border: '1px solid rgba(150,86,254,0.25)',
          borderRadius: 28, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(150,86,254,0.1), 0 0 60px rgba(150,86,254,0.12)',
          display: 'flex',
        }}
      >
        {/* ── Left: features ── */}
        <div style={{
          flex: 1, padding: '36px 32px',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(160deg, rgba(150,86,254,0.07) 0%, transparent 60%)',
        }}>
          {/* Pro badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 18, padding: '5px 14px', borderRadius: 999, background: 'linear-gradient(135deg, rgba(150,86,254,0.2), rgba(59,130,239,0.15))', border: '1px solid rgba(150,86,254,0.35)' }}>
            <i className="ti ti-crown" style={{ fontSize: 14, color: '#FBBF24' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: PURPLE2, letterSpacing: '0.04em' }}>SociMe Pro</span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.3 }}>
            {copy.title}
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px', lineHeight: 1.7 }}>
            {copy.subtitle}
          </p>

          {/* feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PLAN_FEATURES.map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(150,86,254,0.12)', border: '1px solid rgba(150,86,254,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`ti ${f.icon}`} style={{ fontSize: 15, color: PURPLE2 }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* price */}
          <div style={{ marginTop: 28, padding: '16px 20px', borderRadius: 16, background: 'rgba(150,86,254,0.08)', border: '1px solid rgba(150,86,254,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>299 ₪</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>/ לחודש</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>239 ₪ בחיוב שנתי · ביטול בכל עת · 14 יום להחזר מלא</div>
          </div>
        </div>

        {/* ── Right: CTA ── */}
        <div style={{ width: 280, flexShrink: 0, padding: '36px 28px', display: 'flex', flexDirection: 'column' }}>
          {/* close */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 28 }}>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 10, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-x" style={{ fontSize: 14 }} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 20, textAlign: 'center' }}>
              שדרג עכשיו ובטל בכל עת
            </div>

            {/* secure badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { icon: 'ti-lock', text: 'תשלום מאובטח SSL' },
                { icon: 'ti-credit-card', text: 'Visa / Mastercard / American Express' },
                { icon: 'ti-shield-check', text: 'PayPlus — מעבד תשלומים מורשה' },
              ].map(b => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <i className={`ti ${b.icon}`} style={{ fontSize: 14, color: '#0A7159', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{b.text}</span>
                </div>
              ))}
            </div>

            {/* main CTA */}
            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 16, cursor: loading ? 'wait' : 'pointer',
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                border: 'none', color: '#fff', fontSize: 15, fontWeight: 900,
                boxShadow: '0 6px 28px rgba(150,86,254,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                transition: 'all 0.2s', marginBottom: 12, letterSpacing: '-0.2px',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading
                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <><i className="ti ti-crown" style={{ fontSize: 17, color: '#FBBF24' }} /> שדרגו למסלול Pro</>
              }
            </button>

            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.6 }}>
              לחיצה על &quot;שדרגו&quot; תעביר אתכם לדף תשלום מאובטח של PayPlus.<br />
              ניתן לבטל בכל עת מהגדרות החשבון.
            </div>
          </div>

          {/* compare plans link */}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 11, textDecoration: 'underline', marginTop: 16 }}>
            אולי אחר כך
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
