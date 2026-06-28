'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Drawer from '@/components/Drawer'
import ChatBot from '@/components/ChatBot'
import PaywallForm from '@/components/PaywallForm'
import Onboarding from '@/components/Onboarding'

interface Draft { text: string; hashtags: string }

/* ── Design Tokens ── */
const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'
const BLUE    = '#3B82EF'
const NAVY    = '#0D0829'

/* ── Glassmorphism card ── */
const glassCard = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.16)',
  transition: 'all 0.28s ease',
  ...extra,
})

/* ── Blue pill button ── */
const bluePill = (extra?: React.CSSProperties): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '12px 28px', borderRadius: 999,
  background: BLUE,
  color: '#fff', fontWeight: 700, fontSize: 14,
  textDecoration: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-space), sans-serif',
  boxShadow: `0 4px 20px rgba(59,130,239,0.45)`,
  transition: 'all 0.2s ease',
  ...extra,
})

/* ── Ghost pill button ── */
const ghostPill = (extra?: React.CSSProperties): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '12px 28px', borderRadius: 999,
  background: 'rgba(255,255,255,0.12)',
  color: '#fff', fontWeight: 600, fontSize: 14,
  textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)',
  cursor: 'pointer', fontFamily: 'var(--font-space), sans-serif',
  transition: 'all 0.2s ease',
  ...extra,
})

const FEATURES = [
  { icon: 'ti-sparkles',  label: 'תוכן AI',      desc: 'AI שכותב בעברית, בסגנון העסק שלך. פוסטים מותאמים לקהל ולפלטפורמה.', color: PURPLE2 },
  { icon: 'ti-calendar',  label: 'תזמון חכם',    desc: 'אשר פוסטים מראש ו-SociMe תפרסם אוטומטית בשעות הכי אפקטיביות.', color: BLUE },
  { icon: 'ti-photo-ai',  label: 'תמונות AI',    desc: 'תמונות מקצועיות לפוסטים ישירות מהמערכת — בלי Canva, בלי מעצב.', color: '#10D4A8' },
  { icon: 'ti-bulb',      label: 'בנק רעיונות',  desc: 'רעיונות ייחודיים לתוכן שמותאמים לתחום שלך עם הנחיות ברורות.', color: '#F59E0B' },
]

const PLANS = [
  { name: 'חינמי',  price: '0',   note: 'לנצח',  popular: false, features: ['5 פוסטים לחודש', 'פייסבוק ואינסטגרם', 'תמיכה בעברית'],                  btn: 'התחל עכשיו',         href: '/login?mode=register' },
  { name: 'פרו',    price: '149', note: 'לחודש', popular: true,  features: ['100 פוסטים לחודש', 'כל הפלטפורמות', 'תזמון מתקדם', 'תמיכה עדיפה'], btn: 'התחל 14 יום בחינם', href: '/login?mode=register' },
  { name: 'ארגוני', price: '490', note: 'לחודש', popular: false, features: ['פוסטים ללא הגבלה', 'מספר חשבונות', 'API מותאם', 'SLA מובטח'],      btn: 'צור קשר',             href: 'mailto:dor@socime.co.il' },
]

/* ────────────────────────────
   Neon Glassmorphism Card
──────────────────────────── */
function NeonCard({ children, style, delay = 0 }: {
  children: React.ReactNode
  style?: React.CSSProperties
  delay?: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className={hovered ? '' : 'neon-card'}
      style={{
        ...glassCard(),
        animationDelay: `${delay}s`,
        transform: hovered ? 'translateY(-6px)' : 'none',
        boxShadow: hovered
          ? `0 0 0 1.5px rgba(152,80,255,0.5), 0 0 48px rgba(152,80,255,0.5), 0 0 96px rgba(190,86,255,0.25), 0 20px 60px rgba(0,0,0,0.3)`
          : undefined,
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  )
}

/* ────────────────────────────
   Main Page
──────────────────────────── */
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
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
      }),
      { threshold: 0.06 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  if (needsOnboarding && oauthUid) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: NAVY }}>
        <Onboarding userId={oauthUid} onComplete={() => { window.location.href = '/dashboard' }} />
      </div>
    )
  }

  function handlePaywall(draftPost: Draft) {
    setDraft(draftPost)
    setShowPaywall(true)
    setTimeout(() => flipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 20% 0%, rgba(190,86,255,0.35) 0%, transparent 60%),
                   radial-gradient(ellipse at 80% 100%, rgba(59,130,239,0.25) 0%, transparent 55%),
                   linear-gradient(160deg, #0D0829 0%, #160C3D 40%, #0F1654 100%)`,
      fontFamily: 'var(--font-space), sans-serif',
    }}>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ══ NAV ══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: scrolled ? 'rgba(13,8,41,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
            <Image src="/logo.png" alt="SociMe" width={34} height={34} style={{ objectFit: 'cover' }} />
          </div>
          <span className="font-arimo" style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
            Soci<span style={{ color: PURPLE2 }}>Me</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden md:flex">
          {[['תכונות', '#features'], ['מחירים', '#pricing'], ['אודות', '#story']].map(([l, h]) => (
            <a key={l} href={h} style={{
              padding: '7px 16px', borderRadius: 999,
              fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {l}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/login" className="hidden md:block" style={ghostPill({ padding: '8px 18px', fontSize: 13 })}>
            כניסה
          </a>
          <a href="/login?mode=register" style={bluePill({ padding: '9px 22px', fontSize: 13 })}>
            התחל בחינם
          </a>
          <button onClick={() => setDrawerOpen(true)} aria-label="תפריט" className="md:hidden"
            style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span style={{ width: 16, height: 1.5, background: '#fff', borderRadius: 2, display: 'block' }} />
            <span style={{ width: 16, height: 1.5, background: '#fff', borderRadius: 2, display: 'block' }} />
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ padding: '100px 40px 60px', maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* Hero Text */}
          <NeonCard style={{ padding: '48px 44px 44px' }} delay={0}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 14px', borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
              marginBottom: 24,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A3E635', display: 'inline-block' }} className="pulse-dot" />
              גרסת בטא · חינמי להתחלה
            </div>

            <h1 className="font-arimo" style={{
              fontSize: 'clamp(2.2rem,4.5vw,3.4rem)', fontWeight: 700,
              color: '#fff', lineHeight: 1.1, letterSpacing: '-1.5px',
              margin: '0 0 20px',
            }}>
              הסושיאל שלך —<br />
              על <span style={{ color: PURPLE2 }}>אוטומט</span>
            </h1>

            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75,
              margin: '0 0 32px', maxWidth: 380,
              fontFamily: 'var(--font-space), sans-serif',
            }}>
              SociMe כותבת, מתזמנת ומפרסמת תוכן לפייסבוק ואינסטגרם — בעברית, עם AI.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              <a href="/login?mode=register" style={bluePill()}>
                <i className="ti ti-sparkles" style={{ fontSize: 15 }} />
                התחל 14 יום בחינם
              </a>
              <button
                style={ghostPill()}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                ראה הדגמה ↓
              </button>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {['ללא כרטיס אשראי', 'ביטול בכל עת', 'תמיכה בעברית'].map(t => (
                <span key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontWeight: 900, color: '#A3E635', fontSize: 13 }}>✓</span> {t}
                </span>
              ))}
            </div>
          </NeonCard>

          {/* ChatBot */}
          <div ref={flipRef}>
            <NeonCard delay={0.4} style={{ overflow: 'hidden' }}>
              <div className="flip-container w-full">
                <div className={`flip-inner${showPaywall ? ' flipped' : ''}`}>
                  <div className="flip-front">
                    <ChatBot onPaywall={handlePaywall} />
                  </div>
                  <div className="flip-back">
                    <PaywallForm draftPost={draft} onBack={() => setShowPaywall(false)} />
                  </div>
                </div>
              </div>
            </NeonCard>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="reveal" style={{ ...glassCard({ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }) }}>
          {[
            { num: '1,200+', label: 'עסקים פעילים',  icon: 'ti-building-store', color: PURPLE2 },
            { num: '38,000+', label: 'פוסטים נוצרו', icon: 'ti-file-text',      color: BLUE },
            { num: '80%',     label: 'חסכון בזמן',   icon: 'ti-clock',          color: '#10D4A8' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '24px 32px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : undefined,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.color, marginBottom: 4 }} />
              <div className="font-arimo" style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES BENTO ══ */}
      <section id="features" style={{ padding: '20px 40px 60px', maxWidth: 1160, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 999,
            background: 'rgba(152,80,255,0.2)', color: PURPLE2,
            fontSize: 11, fontWeight: 700, border: '1px solid rgba(190,86,255,0.3)', marginBottom: 14,
          }}>הכלים שלנו</div>
          <h2 className="font-arimo" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 10px' }}>
            הכל במקום אחד
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>מיצירת תוכן ועד פרסום אוטומטי — בלי לצאת מהמערכת</p>
        </div>

        <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <NeonCard key={f.label} delay={i * 0.15} style={{ padding: '28px 30px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16, marginBottom: 18,
                background: `${f.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`ti ${f.icon}`} style={{ fontSize: 22, color: f.color }} />
              </div>
              <div className="font-arimo" style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.label}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{f.desc}</div>
            </NeonCard>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ padding: '20px 40px 60px', maxWidth: 1160, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 999,
            background: 'rgba(59,130,239,0.15)', color: '#60A5FA',
            fontSize: 11, fontWeight: 700, border: '1px solid rgba(59,130,239,0.3)', marginBottom: 14,
          }}>איך זה עובד</div>
          <h2 className="font-arimo" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 10px' }}>
            שלושה צעדים לתוצאה
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>בלי לימוד, בלי עיצוב, בלי טרחה</p>
        </div>

        <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { num: '01', title: 'מספר לנו על העסק',  desc: 'שם, תחום, קהל יעד — פעם אחת, זהו.',                      icon: 'ti-building-store', color: PURPLE2 },
            { num: '02', title: 'AI כותב עבורך',      desc: 'SociMe מייצרת פוסטים מותאמים בעברית בשניות.',           icon: 'ti-sparkles',       color: BLUE },
            { num: '03', title: 'מפרסם ושוכח',       desc: 'אשר, תזמן — הפוסט יפורסם בזמן המושלם.',                icon: 'ti-send',           color: '#10D4A8' },
          ].map((step, i) => (
            <NeonCard key={i} delay={i * 0.12} style={{ padding: '32px 28px' }}>
              <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: 'rgba(255,255,255,0.06)', marginBottom: 20 }} className="font-arimo">
                {step.num}
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${step.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <i className={`ti ${step.icon}`} style={{ fontSize: 20, color: step.color }} />
              </div>
              <div className="font-arimo" style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{step.desc}</div>
            </NeonCard>
          ))}
        </div>
      </section>

      {/* ══ STORY ══ */}
      <section id="story" style={{ padding: '20px 40px 60px', maxWidth: 1160, margin: '0 auto' }}>
        <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <NeonCard style={{ padding: '40px 44px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE2, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>
              הסיפור שלנו
            </div>
            <h2 className="font-arimo" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1px', margin: '0 0 18px', lineHeight: 1.2 }}>
              למה בניתי את SociMe?
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: '0 0 14px' }}>
              כשבעלי עסקים קטנים שאלו אותי "איך מצאת זמן לסושיאל?", התשובה הכנה היא שלא מצאתי — עד שבניתי כלי שעושה את זה עבורי.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: 0 }}>
              SociMe נולדה מהצורך האמיתי של עסקים שמבינים שנוכחות דיגיטלית קריטית, אבל אין להם שעות ביום.
            </p>
          </NeonCard>

          <NeonCard style={{ padding: '40px 44px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <div style={{
                width: 58, height: 58, borderRadius: 18, flexShrink: 0,
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 22,
                boxShadow: `0 6px 24px rgba(152,80,255,0.4)`,
              }} className="font-arimo">ד</div>
              <div>
                <div className="font-arimo" style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3 }}>דור דוד אדרי</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: PURPLE2, marginBottom: 14 }}>מייסד ומפתח ראשי</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: 0 }}>
                  יזם טכנולוגי וחובב AI. בעל ניסיון Full-Stack ואינטגרציות Meta API, בונה SociMe מתוך אמונה שכל עסק קטן ראוי לנוכחות דיגיטלית חזקה — בלי תקציב ענק.
                </p>
              </div>
            </div>
          </NeonCard>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" style={{ padding: '20px 40px 60px', maxWidth: 1160, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', gap: 6, padding: '4px 14px', borderRadius: 999,
            background: 'rgba(152,80,255,0.2)', color: PURPLE2,
            fontSize: 11, fontWeight: 700, border: '1px solid rgba(190,86,255,0.3)', marginBottom: 14,
          }}>מחירים</div>
          <h2 className="font-arimo" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 10px' }}>
            פשוט. שקוף. בלי הפתעות.
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>ביטול בכל עת, ללא התחייבות.</p>
        </div>

        <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, alignItems: 'start' }}>
          {PLANS.map((plan, i) => (
            <NeonCard key={plan.name} delay={i * 0.1} style={{
              padding: '32px 28px',
              border: plan.popular ? `1.5px solid rgba(190,86,255,0.5)` : '1px solid rgba(255,255,255,0.12)',
              display: 'flex', flexDirection: 'column',
              position: 'relative',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  padding: '4px 18px', borderRadius: 999,
                  background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                  color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  boxShadow: `0 4px 16px rgba(152,80,255,0.4)`,
                }}>הכי פופולרי</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span className="font-arimo" style={{ fontSize: 44, fontWeight: 700, color: plan.popular ? PURPLE2 : '#fff', letterSpacing: '-2px' }}>₪{plan.price}</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>{plan.note}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      background: plan.popular ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 10, fontWeight: 900,
                    }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={plan.href} style={plan.popular ? bluePill({ display: 'block', textAlign: 'center', padding: '13px 0' }) : ghostPill({ display: 'block', textAlign: 'center', padding: '13px 0' })}>
                {plan.btn}
              </a>
            </NeonCard>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ padding: '20px 40px 80px', maxWidth: 1160, margin: '0 auto' }}>
        <NeonCard style={{ padding: '64px 40px', textAlign: 'center' }}>
          <h2 className="font-arimo" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', margin: '0 0 14px' }}>
            מוכן להתחיל?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: '0 0 32px', lineHeight: 1.7 }}>
            הצטרף ל-1,200+ עסקים שכבר מנהלים את הסושיאל שלהם בצורה חכמה יותר.
          </p>
          <a href="/login?mode=register" style={bluePill({ fontSize: 15, padding: '14px 40px' })}>
            <i className="ti ti-sparkles" style={{ fontSize: 17 }} />
            התחל 14 יום בחינם
          </a>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16, marginBottom: 0 }}>
            ללא כרטיס אשראי · ביטול בכל עת
          </p>
        </NeonCard>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '40px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden' }}>
              <Image src="/logo.png" alt="SociMe" width={32} height={32} style={{ objectFit: 'cover' }} />
            </div>
            <span className="font-arimo" style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
              Soci<span style={{ color: PURPLE2 }}>Me</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>AI-Powered Social Media Manager · Made in Israel</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['ראשי', 'אודות', "פיצ'רים", 'תנאי שימוש', 'פרטיות'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = PURPLE2)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                {l}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
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
