'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Drawer from '@/components/Drawer'
import ChatBot from '@/components/ChatBot'
import PaywallForm from '@/components/PaywallForm'
import Onboarding from '@/components/Onboarding'

interface Draft { text: string; hashtags: string }

/* ─── Tokens ─── */
const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'
const BLUE    = '#3B82EF'

/* ─── Styles ─── */
const glass = (ex?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.13)',
  ...ex,
})

const btn = (ex?: React.CSSProperties): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '13px 30px', borderRadius: 999,
  background: BLUE, color: '#fff',
  fontWeight: 700, fontSize: 15,
  border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-space),sans-serif',
  boxShadow: '0 4px 20px rgba(59,130,239,0.45)',
  transition: 'all .2s', textDecoration: 'none',
  ...ex,
})

const ghost = (ex?: React.CSSProperties): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '13px 30px', borderRadius: 999,
  background: 'rgba(255,255,255,0.1)', color: '#fff',
  fontWeight: 600, fontSize: 15,
  border: '1px solid rgba(255,255,255,0.22)', cursor: 'pointer',
  fontFamily: 'var(--font-space),sans-serif',
  transition: 'all .2s', textDecoration: 'none',
  ...ex,
})

/* ─── Neon hover card ─── */
function NCard({ children, style, delay = 0 }: {
  children: React.ReactNode; style?: React.CSSProperties; delay?: number
}) {
  const [h, setH] = useState(false)
  return (
    <div
      className={h ? '' : 'neon-card'}
      style={{
        ...glass(),
        animationDelay: `${delay}s`,
        transform: h ? 'translateY(-5px)' : 'none',
        transition: 'transform .28s ease, box-shadow .28s ease',
        boxShadow: h ? '0 0 0 1.5px rgba(152,80,255,.5),0 0 48px rgba(152,80,255,.45),0 20px 60px rgba(0,0,0,.3)' : undefined,
        ...style,
      }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >{children}</div>
  )
}

/* ─── Bait Section ─── */
function BaitSection() {
  const [input, setInput] = useState('')
  const [stage, setStage] = useState<'idle'|'loading'|'done'|'error'>('idle')
  const [generatedPost, setGeneratedPost] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleBait() {
    if (!input.trim()) return
    setStage('loading')
    setGeneratedPost('')
    setErrorMsg('')
    try {
      const res = await fetch('/api/demo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pain_point: input.trim() }),
      })
      const data = await res.json() as { post?: string; error?: string }
      if (!res.ok) {
        setErrorMsg(data.error ?? 'שגיאה בלתי צפויה')
        setStage('error')
        return
      }
      setGeneratedPost(data.post ?? '')
      setStage('done')
    } catch {
      setErrorMsg('שגיאת רשת — נסה שוב')
      setStage('error')
    }
  }

  /* split generated post: first sentence visible, rest blurred */
  const firstSentenceEnd = generatedPost.search(/(?<=[.!?])\s/)
  const visibleText = firstSentenceEnd > 0 ? generatedPost.slice(0, firstSentenceEnd + 1) : generatedPost.slice(0, 80)
  const blurredText = firstSentenceEnd > 0 ? generatedPost.slice(firstSentenceEnd + 1) : generatedPost.slice(80)

  return (
    <section id="bait" style={{ padding: '20px 40px 80px', maxWidth: 860, margin: '0 auto' }}>
      <NCard style={{ padding: '64px 64px 56px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 16px', borderRadius: 999,
          background: 'rgba(59,130,239,0.15)', color: '#60A5FA',
          fontSize: 11, fontWeight: 700, border: '1px solid rgba(59,130,239,0.3)',
          marginBottom: 24,
        }}>⚡ הדגמה חיה</div>

        <h2 className="font-arimo" style={{
          fontSize: 'clamp(1.7rem,3.2vw,2.4rem)', fontWeight: 700,
          color: '#fff', letterSpacing: '-1px', margin: '0 0 14px',
        }}>לא מאמינים? תנו לנו 10 שניות ונוכיח לכם.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.48)', margin: '0 0 40px', lineHeight: 1.7 }}>
          כתבו על אחד הכאבים שהלקוחות שלכם חווים — ותראו מה קורה.
        </p>

        {/* Input row — full width, balanced */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          marginBottom: stage === 'done' ? 32 : 0,
          maxWidth: 620, marginInline: 'auto',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBait()}
            placeholder="על איזה כאב ראש של הלקוחות שלכם בא לכם לדבר היום?"
            dir="rtl"
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 16,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', fontSize: 15, outline: 'none',
              fontFamily: 'var(--font-space),sans-serif',
              textAlign: 'right', boxSizing: 'border-box',
              transition: 'border-color .2s, box-shadow .2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(190,86,255,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(152,80,255,0.15)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.boxShadow = 'none' }}
          />
          <button onClick={handleBait} disabled={stage === 'loading'} style={btn({ fontSize: 15, padding: '14px 40px', opacity: stage === 'loading' ? 0.7 : 1 })}>
            {stage === 'loading'
              ? <><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></>
              : 'תפוצצו לי את הפיד 🚀'}
          </button>
          {stage === 'error' && (
            <p style={{ fontSize: 13, color: '#F87171', margin: 0 }}>{errorMsg}</p>
          )}
        </div>

        {stage === 'done' && generatedPost && (
          <div style={{ textAlign: 'right', position: 'relative' }}>
            <div style={{ ...glass({ padding: '24px 28px', borderRadius: 16 }) }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE2, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                ✨ פוסט שנוצר ע&quot;י AI
              </div>

              {/* visible first sentence */}
              <p className="font-arimo" style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 12, lineHeight: 1.5 }}>
                {visibleText}
              </p>

              {/* blurred body with reg-wall */}
              {blurredText && (
                <div style={{ position: 'relative' }}>
                  <p style={{
                    fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8,
                    filter: 'blur(5px)', userSelect: 'none', margin: 0,
                  }}>
                    {blurredText}
                  </p>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      background: 'rgba(13,8,41,0.88)', backdropFilter: 'blur(6px)',
                      borderRadius: 16, padding: '20px 28px', textAlign: 'center',
                      border: '1px solid rgba(190,86,255,0.4)',
                      boxShadow: '0 0 40px rgba(152,80,255,0.25)',
                    }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px', lineHeight: 1.6 }}>
                        הפוסט הזה מוכן להביא לכם לידים.<br />
                        <span style={{ color: PURPLE2 }}>קליק אחד, הרשמה חינמית, והוא שלכם.</span>
                      </p>
                      <a href="/login?mode=register" style={btn({ fontSize: 13, padding: '10px 24px' })}>
                        <i className="ti ti-sparkles" style={{ fontSize: 14 }} />
                        קחו את הפוסט בחינם
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </NCard>
    </section>
  )
}

/* ─── Pricing ─── */
const PLANS = {
  monthly: [
    { name: 'Starter', nameHe: 'מתחיל', price: 79, tokens: '5,000', users: 'משתמש אחד', popular: false,
      features: ['5,000 טוקנים לחודש','פייסבוק + אינסטגרם','תזמון אוטומטי','תמיכה בעברית'],
      href: '/login?mode=register&plan=starter' },
    { name: 'Pro', nameHe: 'פרו', price: 199, tokens: '15,000', users: 'משתמש אחד', popular: true,
      features: ['15,000 טוקנים לחודש','כל הפלטפורמות','תזמון מתקדם + AI','ניתוח ביצועים','תמיכה עדיפות'],
      href: '/login?mode=register&plan=pro' },
    { name: 'Agency', nameHe: 'סוכנות', price: 490, tokens: '60,000', users: 'עד 5 משתמשים', popular: false,
      features: ['60,000 טוקנים לחודש','ניהול מספר חשבונות','API מותאם','דאשבורד צוות','SLA + תמיכה VIP'],
      href: '/login?mode=register&plan=agency' },
  ],
  yearly: [
    { name: 'Starter', nameHe: 'מתחיל', price: 63, tokens: '5,000', users: 'משתמש אחד', popular: false,
      features: ['5,000 טוקנים לחודש','פייסבוק + אינסטגרם','תזמון אוטומטי','תמיכה בעברית'],
      href: '/login?mode=register&plan=starter-y' },
    { name: 'Pro', nameHe: 'פרו', price: 159, tokens: '15,000', users: 'משתמש אחד', popular: true,
      features: ['15,000 טוקנים לחודש','כל הפלטפורמות','תזמון מתקדם + AI','ניתוח ביצועים','תמיכה עדיפות'],
      href: '/login?mode=register&plan=pro-y' },
    { name: 'Agency', nameHe: 'סוכנות', price: 392, tokens: '60,000', users: 'עד 5 משתמשים', popular: false,
      features: ['60,000 טוקנים לחודש','ניהול מספר חשבונות','API מותאם','דאשבורד צוות','SLA + תמיכה VIP'],
      href: '/login?mode=register&plan=agency-y' },
  ],
}

function PricingSection() {
  const [billing, setBilling] = useState<'monthly'|'yearly'>('monthly')
  const plans = PLANS[billing]

  return (
    <section id="pricing" style={{ padding: '0 40px 80px', maxWidth: 1160, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex', gap: 6, padding: '4px 14px', borderRadius: 999,
          background: 'rgba(152,80,255,0.15)', color: PURPLE2,
          fontSize: 11, fontWeight: 700, border: '1px solid rgba(190,86,255,0.3)', marginBottom: 16,
        }}>מחירים</div>
        <h2 className="font-arimo" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 10px' }}>
          תבחרו את המסלול שמתאים לקצב הצמיחה שלכם.
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px' }}>
          בלי הפתעות, בלי חוזים כובלים. שדרגו או בטלו מתי שרק תרצו.
        </p>

        {/* Toggle */}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 999, padding: 4,
        }}>
          {(['monthly','yearly'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              background: billing === b ? BLUE : 'transparent',
              color: billing === b ? '#fff' : 'rgba(255,255,255,0.45)',
              transition: 'all .2s', fontFamily: 'var(--font-space),sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {b === 'monthly' ? 'חודשי' : 'שנתי'}
              {b === 'yearly' && (
                <span style={{
                  padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800,
                  background: billing === 'yearly' ? 'rgba(255,255,255,0.2)' : 'rgba(16,212,168,0.2)',
                  color: billing === 'yearly' ? '#fff' : '#10D4A8',
                }}>חסכו 20% (חודשיים עלינו!)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, alignItems: 'start' }}>
        {plans.map((plan, i) => (
          <NCard key={plan.name} delay={i * 0.1} style={{
            padding: '36px 30px', display: 'flex', flexDirection: 'column', position: 'relative',
            border: plan.popular ? `1.5px solid rgba(190,86,255,0.5)` : undefined,
          }}>
            {plan.popular && (
              <div style={{
                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                padding: '4px 20px', borderRadius: 999,
                background: `linear-gradient(135deg,${PURPLE},${PURPLE2})`,
                color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                boxShadow: `0 4px 16px rgba(152,80,255,0.4)`,
              }}>⭐ הכי פופולרי</div>
            )}
            <span style={{
              padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, alignSelf: 'flex-start',
              background: plan.popular ? 'rgba(190,86,255,0.2)' : 'rgba(255,255,255,0.08)',
              color: plan.popular ? PURPLE2 : 'rgba(255,255,255,0.5)',
              border: `1px solid ${plan.popular ? 'rgba(190,86,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}>{plan.nameHe}</span>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '14px 0 2px' }}>
              <span className="font-arimo" style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1, color: plan.popular ? PURPLE2 : '#fff' }}>
                ₪{plan.price}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>/חודש</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 22, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              <i className="ti ti-coins" style={{ fontSize: 13, color: PURPLE2 }} />
              {plan.tokens} טוקנים · {plan.users}
            </div>

            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: plan.popular ? `linear-gradient(135deg,${PURPLE},${PURPLE2})` : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 900, color: '#fff',
                  }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a href={plan.href} style={plan.popular
              ? btn({ display: 'block', textAlign: 'center', padding: '13px 0' })
              : ghost({ display: 'block', textAlign: 'center', padding: '13px 0' })}>
              בחרו במסלול
            </a>
          </NCard>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.22)', marginTop: 22 }}>
        מחירים לא כוללים מע&quot;מ · ביטול בכל עת · טוקן = יחידת AI אחת (~200–400 טוקנים לפוסט)
      </p>
    </section>
  )
}

/* ─── Main ─── */
function HomeInner() {
  const searchParams = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const flipRef = useRef<HTMLDivElement>(null)

  const oauthUid = searchParams.get('uid')
  const needsOnboarding = searchParams.get('onboarding') === 'true' && !!oauthUid

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
      }),
      { threshold: 0.06 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  if (needsOnboarding && oauthUid) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0D0829' }}>
        <Onboarding userId={oauthUid} onComplete={() => { window.location.href = '/dashboard' }} />
      </div>
    )
  }

  function handlePaywall(d: Draft) {
    setDraft(d); setShowPaywall(true)
    setTimeout(() => flipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 20% 0%,rgba(190,86,255,.3) 0%,transparent 55%),
                   radial-gradient(ellipse at 80% 100%,rgba(59,130,239,.2) 0%,transparent 50%),
                   linear-gradient(160deg,#0D0829 0%,#160C3D 45%,#0F1654 100%)`,
      fontFamily: 'var(--font-space),sans-serif',
    }}>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ══ NAV ══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: scrolled ? 'rgba(13,8,41,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'all .3s ease',
      }}>
        {/* Logo — right (RTL start) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
            <Image src="/logo.png" alt="SociMe" width={34} height={34} style={{ objectFit: 'cover' }} />
          </div>
          <span className="font-arimo" style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
            Soci<span style={{ color: PURPLE2 }}>Me</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[['תכונות','#features'],['אודות','#about'],['מחירים','#pricing']].map(([l,h]) => (
            <a key={l} href={h} style={{ padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {l}
            </a>
          ))}
        </div>

        {/* Auth — left (RTL end) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/login" style={ghost({ padding: '8px 18px', fontSize: 13 })}>כניסה</a>
          <a href="/login?mode=register" style={btn({ padding: '9px 22px', fontSize: 13 })}>הרשמה חינמית</a>
          <button onClick={() => setDrawerOpen(true)} aria-label="תפריט"
            style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span style={{ width: 16, height: 1.5, background: '#fff', borderRadius: 2, display: 'block' }} />
            <span style={{ width: 16, height: 1.5, background: '#fff', borderRadius: 2, display: 'block' }} />
          </button>
        </div>
      </nav>

      {/* ══ HERO — full width ══ */}
      <section style={{ padding: '110px 40px 0', maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ padding: 'clamp(40px,6vw,72px) clamp(32px,6vw,72px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 16px', borderRadius: 999,
              background: 'rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.85)', marginBottom: 32,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A3E635', display: 'inline-block' }} className="pulse-dot" />
              AI Social Manager לעסקים ישראלים
            </div>

            <h1 className="font-arimo" style={{
              fontSize: 'clamp(2.4rem,6vw,4.8rem)', fontWeight: 700,
              color: '#fff', lineHeight: 1.1, letterSpacing: '-2px', margin: '0 0 24px',
              maxWidth: 820,
            }}>
              מספיק לעבוד <span style={{ color: PURPLE2 }}>אצל הסושיאל שלכם.</span>
              <br />הגיע הזמן שהוא יעבוד <span style={{ color: BLUE }}>בשבילכם.</span>
            </h1>

            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.62)', lineHeight: 1.8, margin: '0 0 40px', maxWidth: 580 }}>
              הכירו את SociMe — מנהלת הסושיאל הדיגיטלית שלכם. היא חוקרת, כותבת ומתזמנת תוכן ויראלי שעובד על אוטומט, כדי שאתם תוכלו לחזור לנהל את העסק.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
              <a href="/login?mode=register" style={btn({ fontSize: 16, padding: '14px 36px' })}>
                <i className="ti ti-clock" style={{ fontSize: 17 }} />
                קחו את הזמן שלכם בחזרה – התחילו חינם
              </a>
              <button
                onClick={() => document.getElementById('bait')?.scrollIntoView({ behavior: 'smooth' })}
                style={ghost({ fontSize: 15, padding: '14px 28px' })}>
                תראו לי איך זה עובד ↓
              </button>
            </div>

            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 52 }}>
              {['ללא כרטיס אשראי','ביטול בכל עת','עברית מושלמת','פייסבוק · אינסטגרם · לינקדאין'].map(t => (
                <span key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 900, color: '#A3E635' }}>✓</span>{t}
                </span>
              ))}
            </div>

            {/* Stats strip inside hero */}
            <div style={{
              width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 36,
            }}>
              {[
                { num: '1,200+', label: 'עסקים פעילים',  icon: 'ti-building-store', color: PURPLE2 },
                { num: '38,000+', label: 'פוסטים נוצרו', icon: 'ti-file-text',      color: BLUE },
                { num: '80%',     label: 'חסכון בזמן',   icon: 'ti-clock',          color: '#10D4A8' },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '4px 0', textAlign: 'center',
                  borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : undefined,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.color, marginBottom: 4 }} />
                  <div className="font-arimo" style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BaitSection />

      {/* ══ HOW IT WORKS — 3 צעדים ══ */}
      <section style={{ padding: '0 40px 64px', maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', gap: 6, padding: '4px 14px', borderRadius: 999,
            background: 'rgba(59,130,239,0.15)', color: '#60A5FA',
            fontSize: 11, fontWeight: 700, border: '1px solid rgba(59,130,239,0.3)', marginBottom: 14,
          }}>איך זה עובד</div>
          <h2 className="font-arimo" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1px', margin: '0 0 8px' }}>
            שלושה צעדים. ואז אתם חופשיים.
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0 }}>הגדרה חד-פעמית של 2 דקות — ו-SociMe עובדת בשבילכם מכאן</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, position: 'relative' }}>
          {/* connector line */}
          <div style={{ position: 'absolute', top: 36, right: '16.5%', left: '16.5%', height: 1, background: 'rgba(255,255,255,0.08)', zIndex: 0 }} />
          {[
            {
              num: '01', icon: 'ti-building-store', color: PURPLE2,
              title: 'ספרו לנו על העסק',
              desc: 'בריף קצר — תחום, קהל יעד, טון הדיבור. פעם אחת. SociMe זוכרת הכל ומשתמשת בזה בכל פוסט.',
            },
            {
              num: '02', icon: 'ti-sparkles', color: BLUE,
              title: 'AI כותב, אתם מאשרים',
              desc: 'פוסטים, תמונות, סרטונים — מוכנים בשניות. עברו, ערכו אם רוצים, ואשרו בלחיצה.',
            },
            {
              num: '03', icon: 'ti-send', color: '#10D4A8',
              title: 'SociMe מפרסמת לבד',
              desc: 'בזמן הנכון, בפלטפורמה הנכונה — אוטומטית. אתם מקבלים אישור ומרוויחים שעות בחזרה.',
            },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 24px', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', marginBottom: 22,
                background: `radial-gradient(circle, ${step.color}22 0%, transparent 70%)`,
                border: `1.5px solid ${step.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className={`ti ${step.icon}`} style={{ fontSize: 28, color: step.color }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 900, color: step.color, letterSpacing: '2px', marginBottom: 8, opacity: 0.6 }}>{step.num}</div>
              <div className="font-arimo" style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10, lineHeight: 1.3 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES — כל הכלים ══ */}
      <section id="features" style={{ padding: '0 40px 80px', maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', gap: 6, padding: '4px 14px', borderRadius: 999,
            background: 'rgba(152,80,255,0.15)', color: PURPLE2,
            fontSize: 11, fontWeight: 700, border: '1px solid rgba(190,86,255,0.3)', marginBottom: 16,
          }}>9 כלים. פלטפורמה אחת.</div>
          <h2 className="font-arimo" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 10px' }}>
            כל מה שצוות שיווק עושה — SociMe עושה לבד.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', margin: 0 }}>פייסבוק · אינסטגרם · לינקדאין — כל הכלים במקום אחד</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {([
            {
              icon: 'ti-sparkles', color: PURPLE2,
              title: 'סטודיו יצירה AI',
              desc: 'ה-AI לומד את תיק העסק שלכם — טון הדיבור, הקהל והמותג — וכותב פוסט מלוטש בעברית עם תמונה, האשטאגים וקריאה לפעולה. לכל הפלטפורמות.',
              cta: 'נסו עכשיו', href: '/login?mode=register',
            },
            {
              icon: 'ti-video', color: '#A78BFA',
              title: 'עורך וידאו AI',
              desc: 'העלו סרטון — AI חותך שתיקות, מוסיף כתוביות בעברית אוטומטיות ומייצא MP4 מוכן לפרסום.',
              cta: 'נסו עכשיו', href: '/login?mode=register',
            },
            {
              icon: 'ti-calendar-event', color: BLUE,
              title: 'לוח תזמון חכם',
              desc: 'תזמנו פוסטים שבועות קדימה. SociMe מפרסמת אוטומטית, מנסה שוב אם נכשל, ושולחת אישור.',
              cta: 'ראו הדגמה', href: '/login?mode=register',
            },
            {
              icon: 'ti-clock-bolt', color: '#10D4A8',
              title: 'תזמון AI',
              desc: 'האלגוריתם מנתח מתי הקהל שלכם הכי פעיל — ומציע שעות שמקסמות חשיפה בכל פלטפורמה.',
              cta: 'גלו את השעות שלכם', href: '/login?mode=register',
            },
            {
              icon: 'ti-files', color: '#F59E0B',
              title: 'העלאה מרוכזת',
              desc: 'יש תוכן מוכן? העלו עשרות פוסטים בבת אחת — SociMe מתזמנת ומפרסמת הכל בלי לגעת בכל פוסט.',
              cta: 'נסו עכשיו', href: '/login?mode=register',
            },
            {
              icon: 'ti-message-2-heart', color: '#EC4899',
              title: 'ניהול קהילה',
              desc: 'כל התגובות וההודעות מפייסבוק, אינסטגרם ולינקדאין — Inbox מאוחד אחד. ענו מבלי לעבור בין אפליקציות.',
              cta: 'ראו איך זה עובד', href: '/login?mode=register',
            },
            {
              icon: 'ti-bulb', color: '#34D399',
              title: 'בנק רעיונות AI',
              desc: 'אף פעם לא תגמרו לכם הרעיונות. AI מייצר עשרות רעיונות מותאמים לנישה שלכם — שמרו, ערכו, פרסמו.',
              cta: 'קבלו רעיונות', href: '/login?mode=register',
            },
            {
              icon: 'ti-chart-bar', color: '#60A5FA',
              title: 'ניתוחים סטטיסטיים',
              desc: 'דאשבורד שמראה מה עובד — reach, engagement, מגמות צמיחה. קבלו החלטות מבוססות נתונים, לא תחושות בטן.',
              cta: 'ראו דוגמה', href: '/login?mode=register',
            },
            {
              icon: 'ti-bell', color: '#FB923C',
              title: 'התראות חכמות',
              desc: 'Push notification ברגע שפוסט פורסם, כשיש תגובה חשובה, או כשהטוקנים עומדים להסתיים — תמיד בשליטה.',
              cta: 'הפעילו עכשיו', href: '/login?mode=register',
            },
          ] as { icon: string; color: string; title: string; desc: string; cta: string; href: string }[]).map((feat, i) => (
            <a key={i} href="/login?mode=register" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
              <NCard delay={i * 0.06} style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: `${feat.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, flexShrink: 0 }}>
                  <i className={`ti ${feat.icon}`} style={{ fontSize: 22, color: feat.color }} />
                </div>
                <div className="font-arimo" style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>{feat.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, flex: 1 }}>{feat.desc}</div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 18, padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  background: `${feat.color}18`, color: feat.color, border: `1px solid ${feat.color}35`,
                  transition: 'all .2s', width: 'fit-content',
                }}>
                  {feat.cta} <i className="ti ti-arrow-left" style={{ fontSize: 12 }} />
                </span>
              </NCard>
            </a>
          ))}
        </div>

        {/* platform strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: 52, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', textTransform: 'uppercase' }}>פועל עם</span>
          {[
            { icon: 'ti-brand-facebook', label: 'Facebook', color: '#1877F2' },
            { icon: 'ti-brand-instagram', label: 'Instagram', color: '#E1306C' },
            { icon: 'ti-brand-linkedin', label: 'LinkedIn', color: '#0A66C2' },
          ].map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
              <i className={`ti ${p.icon}`} style={{ fontSize: 20, color: p.color }} />
              {p.label}
            </div>
          ))}
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      <section id="about" style={{ padding: '0 40px 80px', maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr', gap: 16 }}>
          <NCard style={{ padding: '52px 52px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE2, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>EDRI GROUP</div>
            <h2 className="font-arimo" style={{ fontSize: 'clamp(1.5rem,2.8vw,2.1rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1px', margin: '0 0 20px', lineHeight: 1.25 }}>
              לא בנינו עוד כלי.<br />
              <span style={{ color: PURPLE2 }}>בנינו את הפתרון שרצינו שיהיה קיים.</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, margin: '0 0 14px' }}>
              כשבעלי עסקים קטנים שואלים &quot;מאיפה לכם זמן לסושיאל?&quot; — התשובה הכנה היא שלא היה לנו. עד שבנינו כלי שעושה את זה עבורנו.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, margin: '0 0 28px' }}>
              SociMe נולדה מהצורך האמיתי של עסקים שמבינים שנוכחות דיגיטלית קריטית לצמיחה — אבל אין להם שעות ביום, תקציב מעצב, או סבלנות לכלים מסובכים.
            </p>
            <div style={{
              padding: '16px 20px', borderRadius: 14,
              background: 'rgba(152,80,255,0.1)', border: '1px solid rgba(190,86,255,0.2)',
              fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.7,
            }}>
              <strong style={{ color: PURPLE2 }}>המשימה שלנו:</strong> לתת לכל עסק קטן בישראל את הכלים שהיו עד עכשיו שמורים רק לתאגידים עם תקציבי שיווק ענקיים.
            </div>
          </NCard>

          <NCard style={{ padding: '44px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20, flexShrink: 0,
                  background: `linear-gradient(135deg,${PURPLE},${PURPLE2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 24,
                  boxShadow: `0 8px 28px rgba(152,80,255,0.4)`,
                }} className="font-arimo">ד</div>
                <div>
                  <div className="font-arimo" style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 2 }}>דור דוד אדרי</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: PURPLE2 }}>מייסד ומפתח ראשי · EDRI GROUP</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.56)', lineHeight: 1.8, margin: '0 0 26px' }}>
                יזם טכנולוגי, Full-Stack Developer ומומחה אינטגרציות Meta API. בונה SociMe מתוך אמונה שכל עסק ישראלי ראוי לנוכחות דיגיטלית חזקה — בלי להשקיע בגורו שיווק יקר.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { icon: 'ti-brand-linkedin', label: 'LinkedIn' },
                { icon: 'ti-mail', label: 'dor@socime.co.il' },
              ].map(s => (
                <div key={s.label} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 12, color: 'rgba(255,255,255,0.5)',
                }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 14 }} />{s.label}
                </div>
              ))}
            </div>
          </NCard>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <PricingSection />

      {/* ══ CTA BANNER ══ */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1160, margin: '0 auto' }}>
        <NCard style={{ padding: '72px 40px', textAlign: 'center' }}>
          <h2 className="font-arimo" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 14px' }}>
            מוכנים להפסיק לרדוף אחרי הסושיאל?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.58)', margin: '0 0 36px', lineHeight: 1.7, maxWidth: 520, marginInline: 'auto' }}>
            הצטרפו ל-1,200+ עסקים ישראלים שכבר נתנו ל-AI לנהל את הסושיאל שלהם — ומרוויחים שעות בחזרה כל שבוע.
          </p>
          <a href="/login?mode=register" style={btn({ fontSize: 16, padding: '16px 44px' })}>
            <i className="ti ti-clock" style={{ fontSize: 18 }} />
            קחו את הזמן שלכם בחזרה – התחילו חינם
          </a>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', marginTop: 18, marginBottom: 0 }}>
            ללא כרטיס אשראי · הגדרה תוך 2 דקות · ביטול בכל עת
          </p>
        </NCard>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '44px 40px', background: 'rgba(0,0,0,0.22)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden' }}>
              <Image src="/logo.png" alt="SociMe" width={32} height={32} style={{ objectFit: 'cover' }} />
            </div>
            <span className="font-arimo" style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
              Soci<span style={{ color: PURPLE2 }}>Me</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 }}>AI-Powered Social Media Manager · Made in Israel by EDRI GROUP</p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'ראשי',            href: '/' },
              { label: 'אודות',           href: '/#about' },
              { label: 'תכונות',          href: '/#features' },
              { label: 'מחירים',          href: '/#pricing' },
              { label: 'תנאי שימוש',      href: '/dashboard/terms' },
              { label: 'מדיניות פרטיות', href: '/dashboard/privacy' },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = PURPLE2)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.14)' }}>
            © 2025 SociMe · כל הזכויות שמורות · <span style={{ color: PURPLE2, fontWeight: 700 }}>EDRI GROUP</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  )
}
