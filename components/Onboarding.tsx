'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface OnboardingProps {
  userId: string
  onComplete: () => void
}

const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'
const BLUE    = '#3B82EF'

const TONES = [
  { value: 'professional', label: 'מקצועי ורשמי',       icon: '💼' },
  { value: 'funny',        label: 'קליל והומוריסטי',     icon: '😄' },
  { value: 'direct',       label: 'ישיר וחותך',           icon: '🎯' },
  { value: 'educational',  label: 'חינוכי ומעשיר',        icon: '📚' },
  { value: 'marketing',    label: 'סופר-שיווקי',           icon: '🚀' },
  { value: 'friendly',     label: 'בגובה העיניים',         icon: '🤝' },
]

const LOADING_TEXTS = [
  'SociMe לומדת את העסק שלך...',
  'בונה אסטרטגיית תוכן...',
  'מגדירה את קול המותג...',
  'מכינה את סביבת העבודה...',
  'כמעט מוכן! ✨',
]

const inputCls: React.CSSProperties = {
  width: '100%', padding: '14px 18px', borderRadius: 14,
  border: '1.5px solid #E5E7EB', background: '#F9FAFB',
  color: '#111827', fontSize: 15, outline: 'none',
  fontFamily: 'var(--font-space), sans-serif',
  direction: 'rtl', transition: 'border-color .2s, box-shadow .2s',
  boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

export default function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [loadingStage, setLoadingStage] = useState<'idle'|'loading'|'done'>('idle')
  const [loadingText, setLoadingText] = useState(0)
  const [error, setError] = useState('')

  /* Step 1 */
  const [businessName, setBusinessName]   = useState('')
  const [description, setDescription]     = useState('')

  /* Step 2 */
  const [tones, setTones] = useState<string[]>([])

  /* Step 3 */
  const [audience, setAudience] = useState('')

  /* Cycle loading text */
  useEffect(() => {
    if (loadingStage !== 'loading') return
    const id = setInterval(() => setLoadingText(t => (t + 1) % LOADING_TEXTS.length), 1600)
    return () => clearInterval(id)
  }, [loadingStage])

  function toggleTone(v: string) {
    setTones(prev =>
      prev.includes(v)
        ? prev.filter(t => t !== v)
        : prev.length < 2 ? [...prev, v] : prev
    )
  }

  async function handleFinish() {
    setLoadingStage('loading')
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, businessName, rawDescription: description, toneOfVoice: tones[0] || 'friendly', targetAudience: audience }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'שגיאה'); setLoadingStage('idle'); return }
      setLoadingStage('done')
      setTimeout(() => onComplete(), 1200)
    } catch {
      setError('שגיאת רשת, נסו שוב')
      setLoadingStage('idle')
    }
  }

  const progress = (step / 3) * 100

  /* ── Loading Screen ── */
  if (loadingStage === 'loading' || loadingStage === 'done') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 32,
        background: `radial-gradient(ellipse at 30% 20%, rgba(190,86,255,.25) 0%, transparent 55%),
                     linear-gradient(160deg, #0D0829 0%, #160C3D 60%, #0F1654 100%)`,
        padding: 40,
      }}>
        {/* Animated ring + Logo */}
        <div style={{ position: 'relative', width: 104, height: 104 }}>
          <svg viewBox="0 0 104 104" width="104" height="104" style={{ position: 'absolute', inset: 0, animation: 'spin 1.4s linear infinite' }}>
            <circle cx="52" cy="52" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="52" cy="52" r="46" fill="none" stroke="url(#g)" strokeWidth="6"
              strokeDasharray="88 201" strokeLinecap="round" />
            <defs>
              <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={PURPLE} />
                <stop offset="100%" stopColor={PURPLE2} />
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', boxShadow: `0 0 24px rgba(152,80,255,0.4)` }}>
              <Image src="/logo.png" alt="SociMe" width={56} height={56} style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="font-arimo" style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
            {loadingStage === 'done' ? 'הכל מוכן!' : 'SociMe עובדת בשבילכם'}
          </div>
          <div style={{
            fontSize: 15, color: 'rgba(255,255,255,0.55)',
            transition: 'opacity .4s', minHeight: 24,
          }}>
            {LOADING_TEXTS[loadingText]}
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {LOADING_TEXTS.map((_, i) => (
            <div key={i} style={{
              width: i === loadingText ? 24 : 8, height: 8, borderRadius: 999,
              background: i === loadingText ? PURPLE2 : 'rgba(255,255,255,0.15)',
              transition: 'all .4s',
            }} />
          ))}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at 30% 20%, rgba(190,86,255,.2) 0%, transparent 50%),
                   linear-gradient(160deg, #0D0829 0%, #160C3D 60%, #0F1654 100%)`,
      padding: '40px 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: '#fff', borderRadius: 28,
        padding: '44px 48px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
        direction: 'rtl',
        fontFamily: 'var(--font-space), sans-serif',
      }}>

        {/* ── Progress Bar ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  background: step >= s ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : '#F3F4F6',
                  color: step >= s ? '#fff' : '#9CA3AF',
                  transition: 'all .3s',
                  boxShadow: step === s ? `0 4px 14px rgba(152,80,255,0.4)` : 'none',
                }}>
                  {step > s ? '✓' : s}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: step >= s ? '#111827' : '#9CA3AF', transition: 'color .3s' }}>
                  {s === 1 ? 'זהות העסק' : s === 2 ? 'טון הדיבור' : 'קהל יעד'}
                </span>
                {s < 3 && <div style={{ width: 48, height: 2, background: step > s ? `linear-gradient(90deg,${PURPLE},${PURPLE2})` : '#E5E7EB', borderRadius: 2, margin: '0 8px', transition: 'background .4s' }} />}
              </div>
            ))}
          </div>
          {/* Bar */}
          <div style={{ height: 4, background: '#F3F4F6', borderRadius: 999 }}>
            <div style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${PURPLE}, ${PURPLE2})`, width: `${progress}%`, transition: 'width .5s ease' }} />
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 13, color: '#DC2626', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* ══ STEP 1 ══ */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 className="font-arimo" style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                בואו נכיר את הבייבי שלכם. 👶
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                ככל שתספרו יותר — ה-AI יכתוב מדויק יותר
              </p>
            </div>

            <Field label="שם העסק / המותג">
              <input
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="למשל: קפה ירושלים, סטודיו לעיצוב..."
                style={inputCls}
                onFocus={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(152,80,255,0.12)` }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </Field>

            <Field label="במילים שלכם: מה העסק עושה, ולמה הלקוחות בוחרים דווקא בכם?">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="אל תחשבו על זה יותר מדי, פשוט תכתבו כאילו אתם מסבירים לחבר. לדוגמה: אנחנו חברת שיווק שעוזרת לעסקים קטנים להכפיל את המכירות בלי תקציבי ענק..."
                rows={5}
                style={{ ...inputCls, resize: 'none', lineHeight: 1.75 }}
                onFocus={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(152,80,255,0.12)` }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </Field>

            <button
              onClick={() => setStep(2)}
              disabled={!businessName.trim() || !description.trim()}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: !businessName.trim() || !description.trim()
                  ? '#E5E7EB'
                  : `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                color: !businessName.trim() || !description.trim() ? '#9CA3AF' : '#fff',
                fontSize: 15, fontWeight: 700, cursor: !businessName.trim() || !description.trim() ? 'not-allowed' : 'pointer',
                boxShadow: !businessName.trim() || !description.trim() ? 'none' : `0 4px 20px rgba(152,80,255,0.4)`,
                transition: 'all .25s', fontFamily: 'var(--font-space), sans-serif',
                marginTop: 4,
              }}>
              המשך לשלב הבא ←
            </button>
          </div>
        )}

        {/* ══ STEP 2 ══ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 className="font-arimo" style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                איך המותג שלכם נשמע? 🎙️
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                בחרו עד 2 סגנונות שמייצגים אתכם הכי טוב
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {TONES.map(t => {
                const selected = tones.includes(t.value)
                const disabled = !selected && tones.length >= 2
                return (
                  <button
                    key={t.value}
                    onClick={() => toggleTone(t.value)}
                    disabled={disabled}
                    style={{
                      padding: '18px 16px', borderRadius: 16, textAlign: 'right',
                      border: selected ? `2px solid ${PURPLE}` : '1.5px solid #E5E7EB',
                      background: selected ? `rgba(152,80,255,0.07)` : disabled ? '#FAFAFA' : '#fff',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.45 : 1,
                      transition: 'all .2s',
                      boxShadow: selected ? `0 0 0 4px rgba(152,80,255,0.1)` : 'none',
                      fontFamily: 'var(--font-space), sans-serif',
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: selected ? PURPLE : '#111827' }}>
                      {t.label}
                    </div>
                    {selected && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 6, padding: '2px 8px', borderRadius: 999,
                        background: `rgba(152,80,255,0.12)`, color: PURPLE,
                        fontSize: 11, fontWeight: 700,
                      }}>✓ נבחר</div>
                    )}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid #E5E7EB',
                background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-space), sans-serif', transition: 'all .2s',
              }}>
                → חזרה
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={tones.length === 0}
                style={{
                  flex: 2, padding: '13px', borderRadius: 14, border: 'none',
                  background: tones.length === 0 ? '#E5E7EB' : `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                  color: tones.length === 0 ? '#9CA3AF' : '#fff',
                  fontSize: 15, fontWeight: 700, cursor: tones.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: tones.length === 0 ? 'none' : `0 4px 20px rgba(152,80,255,0.4)`,
                  fontFamily: 'var(--font-space), sans-serif', transition: 'all .25s',
                }}>
                המשך ←
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3 ══ */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 className="font-arimo" style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                למי אנחנו מוכרים? 🎯
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                הגדרת קהל מדויקת = תוכן שמביא לידים
              </p>
            </div>

            <Field label="מי הלקוח האידיאלי שלכם?">
              <input
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder='לדוגמה: מנכ"לים של חברות קטנות'
                style={inputCls}
                onFocus={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(152,80,255,0.12)` }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </Field>

            {/* Summary card */}
            <div style={{
              padding: '20px', borderRadius: 16,
              background: 'rgba(152,80,255,0.05)', border: '1px solid rgba(152,80,255,0.15)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>סיכום</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'שם העסק', val: businessName },
                  { label: 'טון', val: tones.map(t => TONES.find(x => x.value === t)?.label).join(' + ') },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#6B7280' }}>{r.label}</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{r.val || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid #E5E7EB',
                background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-space), sans-serif', transition: 'all .2s',
              }}>
                → חזרה
              </button>
              <button
                onClick={handleFinish}
                disabled={!audience.trim()}
                style={{
                  flex: 2, padding: '14px', borderRadius: 14, border: 'none',
                  background: !audience.trim() ? '#E5E7EB' : `linear-gradient(135deg, ${BLUE}, #2563EB)`,
                  color: !audience.trim() ? '#9CA3AF' : '#fff',
                  fontSize: 15, fontWeight: 700, cursor: !audience.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: !audience.trim() ? 'none' : `0 4px 20px rgba(59,130,239,0.4)`,
                  fontFamily: 'var(--font-space), sans-serif', transition: 'all .25s',
                }}>
                🚀 הכינו לי את המערכת
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
