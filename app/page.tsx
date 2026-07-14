'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Onboarding from '@/components/Onboarding'
import PricingPlans from '@/components/pricing/PricingPlans'

/* ─── Tokens ─── */
const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'
const BLUE    = '#3B82EF'
const INK     = '#253A53'   // slate — primary text on the light design
const INK_MID = '#5B5878'
const INK_LOW = '#857FA6'
const NOISE   = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")"

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
  fontFamily: 'var(--font-rubik),sans-serif',
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
  fontFamily: 'var(--font-rubik),sans-serif',
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
        boxShadow: h ? '0 0 0 1.5px rgba(150,86,254,.5),0 0 48px rgba(150,86,254,.45),0 20px 60px rgba(0,0,0,.3)' : undefined,
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

  // Zero-friction lead capture: email the full post instead of forcing signup.
  const [email, setEmail] = useState('')
  const [emailStage, setEmailStage] = useState<'idle'|'loading'|'sent'>('idle')
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  async function handleEmailSubmit() {
    if (!emailValid || emailStage !== 'idle') return
    setEmailStage('loading')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), painPoint: input.trim(), post: generatedPost }),
      })
      // Even a soft failure shouldn't punish the lead — the row is captured
      // server-side; only a hard 4xx/5xx returns to idle so they can retry.
      if (!res.ok && res.status !== 200) { setEmailStage('idle'); return }
      setEmailStage('sent')
    } catch {
      setEmailStage('idle')
    }
  }

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
    <section id="bait" className="reveal" style={{ padding: '20px 40px 80px', maxWidth: 860, margin: '0 auto' }}>
      <NCard style={{ padding: '64px 64px 56px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 16px', borderRadius: 999,
          background: 'rgba(59,130,239,0.15)', color: '#60A5FA',
          fontSize: 11, fontWeight: 700, border: '1px solid rgba(59,130,239,0.3)',
          marginBottom: 24,
        }}>הדגמה חיה</div>

        <h2 className="font-arimo" style={{
          fontSize: 'clamp(1.7rem,3.2vw,2.4rem)', fontWeight: 700,
          color: '#fff', letterSpacing: '-1px', margin: '0 0 14px',
        }}>ראו את זה עובד — עכשיו.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.48)', margin: '0 0 40px', lineHeight: 1.7 }}>
          כתבו במשפט מה העסק שלכם מציע, וקבלו פוסט מוכן לפרסום תוך שניות.
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
            placeholder="מה העסק שלכם עושה? למשל: סטודיו פילאטיס בהרצליה"
            dir="rtl"
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 16,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', fontSize: 15, outline: 'none',
              fontFamily: 'var(--font-rubik),sans-serif',
              textAlign: 'right', boxSizing: 'border-box',
              transition: 'border-color .2s, box-shadow .2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(190,86,254,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(150,86,254,0.15)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.boxShadow = 'none' }}
          />
          <button onClick={handleBait} disabled={stage === 'loading'} style={btn({ fontSize: 15, padding: '14px 40px', opacity: stage === 'loading' ? 0.7 : 1 })}>
            {stage === 'loading'
              ? <><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></>
              : <><i className="ti ti-sparkles" style={{ fontSize: 15 }} /> כתבו לי פוסט עכשיו</>}
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
                    padding: '0 12px',
                  }}>
                    <div style={{
                      width: '100%', maxWidth: 440,
                      background: 'rgba(28,15,43,0.9)', backdropFilter: 'blur(8px)',
                      borderRadius: 18, padding: '22px 24px', textAlign: 'center',
                      border: '1px solid rgba(190,86,254,0.4)',
                      boxShadow: '0 0 44px rgba(150,86,254,0.28)',
                    }}>
                      {emailStage === 'sent' ? (
                        <>
                          <div style={{
                            width: 48, height: 48, borderRadius: '50%', margin: '0 auto 12px',
                            background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <i className="ti ti-mail-check" style={{ fontSize: 24, color: '#34D399' }} />
                          </div>
                          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
                            הפוסט המלא בדרך אליכם! 📬
                          </p>
                          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                            שלחנו את הגרסה המלאה ל-<span style={{ color: PURPLE2, fontWeight: 700 }}>{email.trim()}</span>. בדקו את תיבת הדואר (וגם ספאם, ליתר ביטחון).
                          </p>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: 14.5, fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.5 }}>
                            רוצים את הפוסט המלא?
                          </p>
                          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', margin: '0 0 14px', lineHeight: 1.6 }}>
                            השאירו מייל ונשלח לכם אותו עכשיו — בלי הרשמה, בלי כרטיס אשראי.
                          </p>
                          <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                            <input
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                              type="email"
                              placeholder="you@business.co.il"
                              dir="ltr"
                              style={{
                                width: '100%', padding: '12px 16px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)',
                                color: '#fff', fontSize: 14, outline: 'none', textAlign: 'left',
                                fontFamily: 'var(--font-rubik),sans-serif', boxSizing: 'border-box',
                              }}
                              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(190,86,254,0.5)' }}
                              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
                            />
                            <button
                              onClick={handleEmailSubmit}
                              disabled={!emailValid || emailStage === 'loading'}
                              style={btn({ fontSize: 13.5, padding: '12px 20px', width: '100%', opacity: (!emailValid || emailStage === 'loading') ? 0.6 : 1, cursor: (!emailValid || emailStage === 'loading') ? 'not-allowed' : 'pointer' })}>
                              {emailStage === 'loading'
                                ? <><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></>
                                : <><i className="ti ti-send" style={{ fontSize: 14 }} /> שלחו לי את הפוסט למייל</>}
                            </button>
                          </div>
                        </>
                      )}
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


/* ─── Main ─── */
function HomeInner() {
  const searchParams = useSearchParams()
  const [scrolled, setScrolled] = useState(false)

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
      <div className="light-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(152deg,#E9DEFB 0%,#DCD6F7 45%,#CCE0FF 100%)' }}>
        <Onboarding userId={oauthUid} onComplete={() => { window.location.href = '/dashboard' }} />
      </div>
    )
  }

  return (
    <div className="light-page" style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 20% 0%,rgba(190,86,254,.30) 0%,transparent 55%),
                   radial-gradient(ellipse at 80% 100%,rgba(59,130,239,.26) 0%,transparent 50%),
                   linear-gradient(152deg,#E9DEFB 0%,#DCD6F7 45%,#CCE0FF 100%)`,
      fontFamily: 'var(--font-rubik),sans-serif',
    }}>
      {/* ══ NAV ══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: scrolled ? 'rgba(255,255,255,0.07)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.13)' : '1px solid transparent',
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
          <a href="/login?mode=register" style={btn({ padding: '9px 24px', fontSize: 13 })}>
            התחילו בחינם
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
          </a>
        </div>
      </nav>

      {/* ══ HERO — asymmetric, product-forward ══ */}
      <section style={{ position: 'relative', padding: 'clamp(104px,13vh,150px) 40px 44px', maxWidth: 1240, margin: '0 auto', overflow: 'hidden' }}>
        {/* premium grain — kills the flat-gradient "AI" look */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: NOISE, opacity: 0.5, mixBlendMode: 'soft-light', pointerEvents: 'none' }} />
        {/* soft directional glows behind the product stack */}
        <div aria-hidden style={{ position: 'absolute', insetInlineStart: '-2%', top: '14%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,239,0.30), transparent 62%)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', insetInlineEnd: '12%', top: '2%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(190,86,254,0.26), transparent 64%)', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{
          position: 'relative', zIndex: 1,
          display: 'grid', gridTemplateColumns: 'minmax(0,1.06fr) minmax(0,0.94fr)',
          gap: 'clamp(28px,5vw,64px)', alignItems: 'center',
        }}>
          {/* ── TEXT (RTL start = right) ── */}
          <div>
            <div className="hero-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 15px', borderRadius: 999,
              background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 8px 22px rgba(84,60,150,0.10)',
              fontSize: 12.5, fontWeight: 700, color: INK_MID, marginBottom: 26,
            }}>
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#16B999', display: 'inline-block' }} />
              מנהלת סושיאל AI · לעסקים בישראל
            </div>

            <h1 className="hero-h1" style={{
              fontSize: 'clamp(2.5rem,5.4vw,4.5rem)', fontWeight: 800,
              color: INK, lineHeight: 1.04, letterSpacing: '-2.5px', margin: '0 0 22px',
            }}>
              הסושיאל שלכם,<br />
              <span style={{ background: `linear-gradient(100deg, ${PURPLE}, ${BLUE})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                על טייס אוטומטי.
              </span>
            </h1>

            <p className="hero-sub" style={{ fontSize: 'clamp(15px,1.35vw,18px)', color: INK_MID, lineHeight: 1.7, margin: '0 0 32px', maxWidth: 470 }}>
              SociMe חוקרת את הקהל שלכם, כותבת פוסטים בעברית מושלמת, מעצבת ומתזמנת — ומפרסמת לפייסבוק, אינסטגרם וטיקטוק. אתם רק מאשרים.
            </p>

            <div className="hero-ctas" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <a href="/login?mode=register" style={btn({ fontSize: 16, padding: '15px 32px' })}>
                התחילו בחינם
                <i className="ti ti-arrow-left" style={{ fontSize: 16 }} />
              </a>
              <button
                onClick={() => document.getElementById('bait')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '15px 26px', borderRadius: 999, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.66)', border: '1px solid rgba(255,255,255,0.9)',
                  color: INK, fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-rubik),sans-serif',
                  boxShadow: '0 8px 22px rgba(84,60,150,0.10)',
                }}>
                <i className="ti ti-player-play-filled" style={{ fontSize: 14, color: BLUE }} />
                ראו איך זה עובד
              </button>
            </div>

            <div className="hero-ctas" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {['ללא כרטיס אשראי', 'ביטול בכל עת', 'עברית מושלמת'].map(t => (
                <span key={t} style={{ fontSize: 13, color: INK_LOW, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-circle-check-filled" style={{ color: '#16B999', fontSize: 15 }} />{t}
                </span>
              ))}
            </div>
          </div>

          {/* ── PRODUCT SHOWCASE (RTL end = left) ── */}
          <div className="hero-visual" style={{ position: 'relative', minHeight: 460 }}>

            {/* Calendar card — peeking behind, tilted */}
            <div className="hero-float-a" style={{
              position: 'absolute', top: 0, insetInlineStart: 0, width: 260,
              transform: 'rotate(-5deg)',
              background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(255,255,255,0.9)', borderRadius: 20, padding: '16px 18px',
              boxShadow: '0 24px 50px rgba(84,60,150,0.18)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 12 }}>השבוע שלכם</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
                {['א','ב','ג','ד','ה','ו','ש'].map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '6px 0', borderRadius: 9,
                    background: i === 2 ? `linear-gradient(160deg, rgba(150,86,254,0.16), rgba(59,130,239,0.10))` : 'transparent',
                    border: i === 2 ? '1px solid rgba(150,86,254,0.30)' : '1px solid transparent',
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: i === 2 ? PURPLE : INK_LOW }}>{d}</span>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      fontSize: 9, fontWeight: 800,
                      background: i === 2 ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'transparent',
                      color: i === 2 ? '#fff' : INK_MID,
                    }}>{6 + i}</span>
                    {(i === 1 || i === 2 || i === 4) && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: i === 4 ? BLUE : PURPLE }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Main card — AI generator */}
            <div className="hero-float-b" style={{
              position: 'absolute', top: 74, insetInlineEnd: 0, width: 340, maxWidth: '100%',
              background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
              border: '1px solid rgba(255,255,255,0.95)', borderRadius: 22, padding: 20,
              boxShadow: '0 40px 80px rgba(84,60,150,0.22)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${PURPLE}, ${BLUE})`, display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(150,86,254,0.4)' }}>
                  <i className="ti ti-sparkles" style={{ fontSize: 15, color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, lineHeight: 1 }}>יצירה מהירה</div>
                  <div style={{ fontSize: 10, color: INK_LOW, marginTop: 2 }}>SociMe AI</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#16B999', background: 'rgba(22,185,153,0.12)', border: '1px solid rgba(22,185,153,0.28)', padding: '3px 8px', borderRadius: 999 }}>מוכן</span>
              </div>

              <div style={{ fontSize: 11, color: INK_LOW, marginBottom: 8 }}>הנחיה:</div>
              <div style={{ fontSize: 12.5, color: INK_MID, background: 'rgba(120,90,200,0.06)', borderRadius: 10, padding: '9px 11px', marginBottom: 12 }}>
                מבצע סוף עונה — 20% על כל הקולקציה 🔥
              </div>

              <div style={{ borderRadius: 12, border: '1px solid rgba(120,90,200,0.14)', padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, color: INK, lineHeight: 1.65, marginBottom: 8 }}>
                  🌸 סוף עונה = התחלה חדשה לארון! כל הקולקציה ב-20% הנחה, רק לשבוע. רוצות להתחדש? קפצו לסטורי 👆
                </div>
                <div style={{ fontSize: 11, color: BLUE, fontWeight: 600 }}>#אופנה #מבצע #סוף_עונה</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  {[['ti-brand-instagram', '#E1306C'], ['ti-brand-facebook', '#1877F2'], ['ti-brand-tiktok', '#000']].map(([ic, c]) => (
                    <span key={ic} style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(120,90,200,0.07)', display: 'grid', placeItems: 'center' }}>
                      <i className={`ti ${ic}`} style={{ fontSize: 14, color: c as string }} />
                    </span>
                  ))}
                </div>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 999, border: 'none', background: `linear-gradient(120deg, ${PURPLE}, ${BLUE})`, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 16px rgba(150,86,254,0.4)', fontFamily: 'var(--font-rubik),sans-serif' }}>
                  <i className="ti ti-send" style={{ fontSize: 13 }} />
                  תזמון
                </button>
              </div>
            </div>

            {/* Floating "published" notification */}
            <div className="hero-float-c logo-float" style={{
              position: 'absolute', bottom: 16, insetInlineStart: 24, zIndex: 2,
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.95)', borderRadius: 14, padding: '11px 15px',
              boxShadow: '0 20px 44px rgba(84,60,150,0.20)',
            }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(22,185,153,0.14)', border: '1px solid rgba(22,185,153,0.3)', display: 'grid', placeItems: 'center' }}>
                <i className="ti ti-check" style={{ fontSize: 16, color: '#16B999' }} />
              </span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: INK, lineHeight: 1 }}>הפוסט פורסם ✓</div>
                <div style={{ fontSize: 10.5, color: INK_LOW, marginTop: 3 }}>12 לייקים · 3 תגובות · עכשיו</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="hero-ctas" style={{
          position: 'relative', zIndex: 1, marginTop: 'clamp(40px,6vw,72px)',
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          borderTop: '1px solid rgba(120,90,200,0.16)', paddingTop: 28,
        }}>
          {[
            { num: '30 שנ׳', label: 'מרעיון לפוסט מוכן', icon: 'ti-bolt', color: PURPLE },
            { num: '3', label: 'רשתות ממקום אחד', icon: 'ti-share', color: BLUE },
            { num: '24/7', label: 'עובד גם כשאתם ישנים', icon: 'ti-clock', color: '#16B999' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '4px 0', textAlign: 'center',
              borderInlineStart: i > 0 ? '1px solid rgba(120,90,200,0.12)' : undefined,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.color, marginBottom: 4 }} />
              <div style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 800, color: INK, letterSpacing: '-1px', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: INK_LOW }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <BaitSection />

      {/* ══ TRUST BAR — honest, no fabricated social proof ══ */}
      <section className="reveal" style={{ padding: '4px 40px 64px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          ...glass({ padding: '26px 32px', borderRadius: 22 }),
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 28, flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#34D399', letterSpacing: '0.5px', marginBottom: 6 }}>
              בהרצה עם עסקי הפיילוט הראשונים בישראל
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              מתחברת ישירות לרשתות שאתם כבר עובדים איתן — בלי כלים חיצוניים.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            {[
              { icon: 'ti-brand-facebook',  label: 'Facebook',  color: '#1877F2' },
              { icon: 'ti-brand-instagram', label: 'Instagram', color: '#E1306C' },
              { icon: 'ti-brand-tiktok',    label: 'TikTok',    color: '#ff0050' },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                <i className={`ti ${p.icon}`} style={{ fontSize: 20, color: p.color }} />
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS — 3 צעדים ══ */}
      <section className="reveal" style={{ padding: '8px 40px 72px', maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            display: 'inline-flex', gap: 6, padding: '5px 15px', borderRadius: 999,
            background: 'rgba(59,130,239,0.12)', color: '#2E6FD6',
            fontSize: 12, fontWeight: 700, border: '1px solid rgba(59,130,239,0.26)', marginBottom: 16,
          }}>איך זה עובד</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.4vw,2.6rem)', fontWeight: 800, color: INK, letterSpacing: '-1.5px', margin: '0 0 10px' }}>
            שלושה צעדים. ואז אתם חופשיים.
          </h2>
          <p style={{ fontSize: 15, color: INK_LOW, margin: 0 }}>הגדרה חד-פעמית של 2 דקות — ו-SociMe עובדת בשבילכם מכאן</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }} className="steps-grid">
          {[
            {
              num: '01', icon: 'ti-building-store', color: PURPLE, grad: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
              title: 'ספרו לנו על העסק',
              desc: 'בריף קצר — תחום, קהל יעד, טון הדיבור. פעם אחת. SociMe זוכרת הכל ומשתמשת בזה בכל פוסט.',
            },
            {
              num: '02', icon: 'ti-sparkles', color: BLUE, grad: `linear-gradient(135deg, ${BLUE}, #6AA0FF)`,
              title: 'AI כותב, אתם מאשרים',
              desc: 'פוסטים, תמונות, סרטונים — מוכנים בשניות. עברו, ערכו אם רוצים, ואשרו בלחיצה.',
            },
            {
              num: '03', icon: 'ti-send', color: '#16B999', grad: 'linear-gradient(135deg, #16B999, #3BD1A6)',
              title: 'SociMe מפרסמת לבד',
              desc: 'בזמן הנכון, בפלטפורמה הנכונה — אוטומטית. אתם מקבלים אישור ומרוויחים שעות בחזרה.',
            },
          ].map((step, i) => (
            <div key={i} style={{
              position: 'relative', overflow: 'hidden',
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.75)', borderRadius: 22, padding: '30px 26px',
              boxShadow: '0 10px 34px rgba(84,60,150,0.12)',
            }}>
              {/* ghost numeral */}
              <span aria-hidden style={{
                position: 'absolute', top: -18, insetInlineEnd: 6,
                fontSize: 118, fontWeight: 800, lineHeight: 1,
                background: step.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                opacity: 0.12, pointerEvents: 'none', letterSpacing: '-4px',
              }}>{step.num}</span>

              <div style={{
                width: 52, height: 52, borderRadius: 15, marginBottom: 18,
                background: step.grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 20px ${step.color}44`,
              }}>
                <i className={`ti ${step.icon}`} style={{ fontSize: 24, color: '#fff' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: INK, margin: '0 0 10px', lineHeight: 1.3 }}>{step.title}</h3>
              <p style={{ fontSize: 13.5, color: INK_MID, lineHeight: 1.75, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES — 4 value pillars ══ */}
      <section id="features" className="reveal" style={{ padding: '0 40px 80px', maxWidth: 1060, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 'clamp(1.9rem,3.5vw,2.7rem)', fontWeight: 800, color: INK, letterSpacing: '-1.5px', margin: '0 0 10px' }}>
            כל מה שצוות שיווק עושה — <span style={{ background: `linear-gradient(100deg, ${PURPLE}, ${BLUE})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>SociMe עושה לבד.</span>
          </h2>
          <p style={{ fontSize: 15, color: INK_LOW, margin: 0 }}>ארבעה תחומים, פלטפורמה אחת. בלי לקפוץ בין כלים.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {([
            {
              icon: 'ti-sparkles', color: PURPLE2,
              title: 'יוצר תוכן שנראה מקצועי',
              desc: 'ה-AI לומד את תיק העסק שלכם — טון הדיבור, הקהל והמותג — וכותב פוסטים בעברית עם תמונה והאשטאגים, עורך וידאו עם כתוביות אוטומטיות, ומספק בנק רעיונות שלא נגמר.',
              tools: ['סטודיו יצירה', 'עורך וידאו', 'בנק רעיונות'],
            },
            {
              icon: 'ti-calendar-event', color: BLUE,
              title: 'מתזמן ומפרסם לבד',
              desc: 'תזמנו שבועות קדימה — SociMe מפרסמת אוטומטית בשעה החכמה לכל רשת, מנסה שוב אם נכשל, ומאפשרת להעלות עשרות פוסטים בבת אחת.',
              tools: ['לוח תזמון', 'תזמון AI', 'העלאה מרוכזת'],
            },
            {
              icon: 'ti-message-2-heart', color: '#EC4899',
              title: 'מנהל את הקהילה',
              desc: 'כל התגובות וההודעות מכל הרשתות ב-Inbox אחד מאוחד, עם התראות חכמות ברגע שקורה משהו שדורש את תשומת ליבכם.',
              tools: ['Inbox מאוחד', 'התראות חכמות'],
            },
            {
              icon: 'ti-chart-bar', color: '#34D399',
              title: 'מנתח ומשפר',
              desc: 'דאשבורד שמראה מה באמת עובד — חשיפה, מעורבות ומגמות צמיחה — כדי שתקבלו החלטות לפי נתונים, לא לפי תחושות בטן.',
              tools: ['ניתוחים', 'מגמות צמיחה'],
            },
          ] as { icon: string; color: string; title: string; desc: string; tools: string[] }[]).map((feat, i) => (
            <NCard key={i} delay={i * 0.08} style={{ padding: '30px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${feat.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${feat.icon}`} style={{ fontSize: 24, color: feat.color }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.3 }}>{feat.title}</div>
              </div>
              <div style={{ fontSize: 14, color: INK_MID, lineHeight: 1.8, flex: 1, marginBottom: 18 }}>{feat.desc}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {feat.tools.map(t => (
                  <span key={t} style={{
                    fontSize: 11.5, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                    background: `${feat.color}14`, color: feat.color, border: `1px solid ${feat.color}2e`,
                  }}>{t}</span>
                ))}
              </div>
            </NCard>
          ))}
        </div>

        {/* single section CTA */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            onClick={() => document.getElementById('bait')?.scrollIntoView({ behavior: 'smooth' })}
            style={btn({ fontSize: 15, padding: '14px 36px' })}>
            <i className="ti ti-sparkles" style={{ fontSize: 16 }} />
            נסו בחינם · ללא הרשמה
          </button>
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      <section id="about" className="reveal" style={{ padding: '0 40px 80px', maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr', gap: 16 }}>
          <NCard style={{ padding: '52px 52px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE2, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>EDRI GROUP</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,2.8vw,2.2rem)', fontWeight: 800, color: INK, letterSpacing: '-1px', margin: '0 0 20px', lineHeight: 1.25 }}>
              לא בנינו עוד כלי.<br />
              <span style={{ background: `linear-gradient(100deg, ${PURPLE}, ${BLUE})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>בנינו את הפתרון שרצינו שיהיה קיים.</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, margin: '0 0 14px' }}>
              כשבעלי עסקים קטנים שואלים &quot;מאיפה לכם זמן לסושיאל?&quot; — התשובה הכנה היא שלא היה לנו. עד שבנינו כלי שעושה את זה עבורנו.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, margin: '0 0 28px' }}>
              SociMe נולדה מהצורך האמיתי של עסקים שמבינים שנוכחות דיגיטלית קריטית לצמיחה — אבל אין להם שעות ביום, תקציב מעצב, או סבלנות לכלים מסובכים.
            </p>
            <div style={{
              padding: '16px 20px', borderRadius: 14,
              background: 'rgba(150,86,254,0.1)', border: '1px solid rgba(190,86,254,0.2)',
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
                  color: '#fff', boxShadow: `0 8px 28px rgba(150,86,254,0.4)`,
                }}>
                  <i className="ti ti-code" style={{ fontSize: 28 }} />
                </div>
                <div>
                  <div className="font-arimo" style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 2 }}>EDRI GROUP</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: PURPLE2 }}>סטודיו לפיתוח ונוכחות דיגיטלית</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.56)', lineHeight: 1.8, margin: '0 0 26px' }}>
                EDRI GROUP מתמחה בבניית אתרים, דפי נחיתה וחוויות דיגיטליות שמניעות עסקים קדימה. SociMe היא מוצר הדגל שלנו — אותה מומחיות שאנחנו נותנים ללקוחות, ארוזה בכלי שעובד בשבילכם 24/7.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { icon: 'ti-world', label: 'אתרי תדמית' },
                { icon: 'ti-rocket', label: 'דפי נחיתה' },
                { icon: 'ti-sparkles', label: 'אוטומציות AI' },
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
      <div className="reveal">
        <PricingPlans variant="section" />
      </div>

      {/* ══ CTA BANNER ══ */}
      <section className="reveal" style={{ padding: '0 40px 80px', maxWidth: 1160, margin: '0 auto' }}>
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 30, textAlign: 'center',
          padding: 'clamp(52px,7vw,84px) 40px',
          background: 'linear-gradient(140deg, rgba(150,86,254,0.16) 0%, rgba(255,255,255,0.5) 45%, rgba(59,130,239,0.16) 100%)',
          backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 30px 70px rgba(84,60,150,0.18)',
        }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: NOISE, opacity: 0.5, mixBlendMode: 'soft-light', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(1.9rem,3.6vw,3rem)', fontWeight: 800, color: INK, letterSpacing: '-1.5px', margin: '0 0 16px' }}>
              מוכנים להפסיק לרדוף<br />אחרי{' '}
              <span style={{ background: `linear-gradient(100deg, ${PURPLE}, ${BLUE})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>הסושיאל?</span>
            </h2>
            <p style={{ fontSize: 16, color: INK_MID, margin: '0 auto 36px', lineHeight: 1.7, maxWidth: 520 }}>
              תנו ל-AI לנהל את הסושיאל שלכם — ותרוויחו שעות בחזרה כל שבוע, בלי לוותר על הנוכחות הדיגיטלית.
            </p>
            <a href="/login?mode=register" style={btn({ fontSize: 16, padding: '16px 44px' })}>
              <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
              התחילו בחינם
            </a>
            <p style={{ fontSize: 12.5, color: INK_LOW, marginTop: 18, marginBottom: 0 }}>
              ללא כרטיס אשראי · הגדרה תוך 2 דקות · ביטול בכל עת
            </p>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.7)', padding: '48px 40px', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
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
            © {new Date().getFullYear()} SociMe · כל הזכויות שמורות · <span style={{ color: PURPLE2, fontWeight: 700 }}>EDRI GROUP</span>
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
