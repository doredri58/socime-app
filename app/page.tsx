'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Drawer from '@/components/Drawer'
import ChatBot from '@/components/ChatBot'
import PaywallForm from '@/components/PaywallForm'
import Onboarding from '@/components/Onboarding'

interface Draft { text: string; hashtags: string }

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
      })
    }, { threshold: 0.1 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

function useCounterAnimation(target: number, suffix: string, triggered: boolean) {
  const [val, setVal] = useState('0' + suffix)
  useEffect(() => {
    if (!triggered) return
    const duration = 1800
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target).toLocaleString() + suffix)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [triggered, target, suffix])
  return val
}

function HomeInner() {
  const searchParams = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<HTMLDivElement>(null)

  // Google OAuth callback — show onboarding for new users
  const oauthUid = searchParams.get('uid')
  const needsOnboarding = searchParams.get('onboarding') === 'true' && !!oauthUid
  useScrollReveal()

  const stat1 = useCounterAnimation(1240, '+', statsVisible)
  const stat2 = useCounterAnimation(38500, '+', statsVisible)
  const stat3 = useCounterAnimation(80, '%', statsVisible)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect() } }, { threshold: 0.4 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  if (needsOnboarding && oauthUid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg,#f8f4ff 0%,#ffffff 60%)' }}>
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
    <>
      {/* Hamburger */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="פתח תפריט"
        className="fixed top-20 right-6 z-[100] w-11 h-11 rounded-2xl bg-white flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
        style={{ boxShadow: '0 2px 12px rgba(161,70,255,0.15), 0 0 0 1px rgba(161,70,255,0.12)' }}
      >
        {[0, 1, 2].map(i => (
          <span key={i} className="block w-5 h-0.5 rounded-sm" style={{ background: 'var(--purple)' }} />
        ))}
      </button>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ══ NAV ══ */}
      <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-xl"
        style={{ borderBottom: '1px solid rgba(161,70,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SociMe Logo" width={36} height={36} className="rounded-xl" style={{ boxShadow: '0 0 12px rgba(161,70,255,0.3)' }} />
          <span className="text-lg font-black tracking-tight" style={{ color: 'var(--text-dark)' }}>
            Soci<span style={{ color: 'var(--purple)' }}>Me</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          {['תכונות', 'מחירים', 'אודות'].map(l => (
            <a key={l} href={`#${l === 'תכונות' ? 'features' : l === 'מחירים' ? 'pricing' : 'story'}`}
              className="px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer"
              style={{ color: 'var(--text-mid)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--purple-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--purple)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)' }}
            >{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a href="/login"
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
            style={{ color: 'var(--purple)', border: '1.5px solid var(--purple-border)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--purple-soft)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            כניסה
          </a>
          <a href="/login?mode=register"
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 0 20px rgba(161,70,255,0.3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(161,70,255,0.45)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(161,70,255,0.3)'; (e.currentTarget as HTMLElement).style.transform = '' }}
          >
            התחל בחינם
          </a>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-20">
        {/* Subtle background blobs */}
        <div className="absolute pointer-events-none inset-0 overflow-hidden">
          <div className="absolute rounded-full" style={{ width: 600, height: 600, top: '-15%', right: '-10%', background: 'radial-gradient(circle, rgba(161,70,255,0.07) 0%, transparent 65%)' }} />
          <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: '-10%', left: '-8%', background: 'radial-gradient(circle, rgba(196,127,255,0.06) 0%, transparent 65%)' }} />
        </div>

        {/* Logo stage */}
        <div className="relative flex items-center justify-center mb-12" style={{ width: 180, height: 180 }}>
          {/* Ambient glow */}
          <div className="absolute inset-0 rounded-full logo-glow-bg"
            style={{ background: 'radial-gradient(circle, rgba(161,70,255,0.18) 0%, transparent 70%)', width: '140%', height: '140%', top: '-20%', left: '-20%' }} />

          {/* Orbit ring 1 */}
          <div className="absolute rounded-full ring-cw"
            style={{ width: 164, height: 164, border: '1px dashed rgba(161,70,255,0.2)', top: 8, left: 8 }}>
            <div className="absolute rounded-full" style={{ width: 7, height: 7, background: 'var(--purple)', top: -3.5, left: '50%', marginLeft: -3.5, boxShadow: '0 0 8px rgba(161,70,255,0.8)' }} />
          </div>

          {/* Orbit ring 2 */}
          <div className="absolute rounded-full ring-ccw"
            style={{ width: 210, height: 210, border: '1px solid rgba(161,70,255,0.1)', top: -15, left: -15 }}>
            <div className="absolute rounded-full" style={{ width: 5, height: 5, background: 'var(--purple-light)', bottom: '15%', right: -2.5, boxShadow: '0 0 6px rgba(196,127,255,0.7)' }} />
          </div>

          {/* Logo image — floating */}
          <div className="relative logo-reveal logo-float" style={{ zIndex: 2 }}>
            <Image
              src="/logo.png"
              alt="SociMe"
              width={120}
              height={120}
              className="rounded-3xl select-none"
              style={{
                boxShadow: '0 8px 40px rgba(161,70,255,0.35), 0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.6)',
                filter: 'drop-shadow(0 0 20px rgba(161,70,255,0.25))'
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Badge */}
        <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold"
          style={{ background: 'var(--purple-soft)', border: '1px solid var(--purple-border)', color: 'var(--purple)' }}>
          <span className="w-1.5 h-1.5 rounded-full pulse-dot inline-block" style={{ background: 'var(--purple)' }} />
          בינה מלאכותית לסושיאל מדיה · גירסת בטא פתוחה
        </div>

        {/* Headline */}
        <h1 className="hero-h1 text-center font-black leading-[1.05] mb-6"
          style={{ fontSize: 'clamp(2.6rem,5.5vw,4.2rem)', letterSpacing: '-2px', color: 'var(--text-dark)' }}>
          נהל את הסושיאל שלך<br />
          <span className="shimmer-gradient">בלי להתאמץ</span>
        </h1>

        {/* Sub */}
        <p className="hero-sub text-center leading-relaxed mb-10"
          style={{ fontSize: 18, color: 'var(--text-mid)', maxWidth: 500, lineHeight: 1.8 }}>
          SociMe כותבת, מתזמנת ומפרסמת תוכן ל-Facebook ו-Instagram עבורך —<br />
          תוך שניות, בעברית, עם AI חכם.
        </p>

        {/* CTAs */}
        <div className="hero-ctas flex gap-3 justify-center flex-wrap mb-16">
          <button
            className="px-8 py-3.5 rounded-2xl text-white font-bold text-base transition-all"
            style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 0 28px rgba(161,70,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 36px rgba(161,70,255,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(161,70,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}
          >
            התחל 14 יום בחינם
          </button>
          <button
            className="px-8 py-3.5 rounded-2xl font-semibold text-base transition-all"
            style={{ background: 'white', color: 'var(--text-mid)', border: '1px solid rgba(161,70,255,0.2)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(161,70,255,0.4)'; (e.currentTarget as HTMLElement).style.color = 'var(--purple)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(161,70,255,0.2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)' }}
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            ראה איך זה עובד
          </button>
        </div>

        {/* ChatBot / Paywall flip */}
        <div ref={flipRef} className="flip-container w-full" style={{ maxWidth: 600, position: 'relative', zIndex: 10 }}>
          <div className={`flip-inner${showPaywall ? ' flipped' : ''}`}>
            <div className="flip-front">
              <ChatBot onPaywall={handlePaywall} />
            </div>
            <div className="flip-back">
              <PaywallForm draftPost={draft} onBack={() => setShowPaywall(false)} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <div ref={statsRef} className="py-16 px-6 bg-white" style={{ borderTop: '1px solid rgba(161,70,255,0.07)', borderBottom: '1px solid rgba(161,70,255,0.07)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-0">
          {[
            { val: stat1, label: 'עסקים פעילים' },
            { val: stat2, label: 'פוסטים נוצרו' },
            { val: stat3, label: 'חסכון בזמן' },
          ].map((s, i) => (
            <div key={i} className="text-center px-8 py-6" style={{ borderRight: i < 2 ? '1px solid rgba(161,70,255,0.1)' : undefined }}>
              <div className="text-3xl font-black mb-1" style={{ color: 'var(--purple)', letterSpacing: '-1px' }}>{s.val}</div>
              <div className="text-sm" style={{ color: 'var(--text-light)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ STORY ══ */}
      <section id="story" className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid gap-16 md:grid-cols-2 items-center">
          <div className="reveal">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--purple)' }}>הסיפור שלנו</div>
            <h2 className="font-extrabold leading-tight mb-6" style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)', letterSpacing: '-1px', color: 'var(--text-dark)' }}>
              למה בניתי את<br /><span style={{ color: 'var(--purple)' }}>SociMe</span>?
            </h2>
            <p className="leading-relaxed mb-10 text-base" style={{ color: 'var(--text-mid)', lineHeight: 1.85 }}>
              כשבעלי עסקים קטנים שאלו אותי "איך מצאת זמן לסושיאל?", התשובה הכנה היא שלא מצאתי — עד שבניתי כלי שעושה את זה עבורי.
              <br /><br />
              SociMe נולדה מהצורך האמיתי של בעלי עסקים שמבינים שנוכחות דיגיטלית קריטית לצמיחה, אבל אין להם שעות פנויות ליצור תוכן כל יום.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[{ num: '97%', label: 'חסכון בזמן כתיבה' }, { num: '3x', label: 'יותר פוסטים בחודש' }, { num: '₪0', label: 'עלות קופירייטר' }].map(s => (
                <div key={s.label} className="rounded-2xl p-5 text-center transition-all cursor-default glow-card"
                  style={{ background: 'white' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}>
                  <div className="text-2xl font-black" style={{ color: 'var(--purple)' }}>{s.num}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal" style={{ transitionDelay: '0.15s' }}>
            <div className="bg-white rounded-3xl p-8 glow-card">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 4px 20px rgba(161,70,255,0.3)' }}>ד</div>
                <div>
                  <div className="text-lg font-extrabold" style={{ color: 'var(--text-dark)' }}>דור דוד אדרי</div>
                  <div className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold mt-1"
                    style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>מייסד ומפתח ראשי</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)', lineHeight: 1.85 }}>
                יזם טכנולוגי וחובב AI, דור בנה את SociMe מתוך אמונה שכל עסק קטן בישראל ראוי לנוכחות דיגיטלית חזקה — בלי צורך בתקציב ענק.
                <br /><br />
                בעל ניסיון בפיתוח Full-Stack ואינטגרציות Meta API, דור שם לב שהפתרונות הקיימים לא מתאימים לקצב ולשפה של העסק הישראלי.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="py-32 px-6" style={{ background: '#FAFAFE' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 reveal">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--purple)' }}>כלים חכמים</div>
            <h2 className="text-4xl font-extrabold mb-4" style={{ letterSpacing: '-1.2px', color: 'var(--text-dark)' }}>הכל במקום אחד</h2>
            <p className="text-base" style={{ color: 'var(--text-mid)', maxWidth: 420, margin: '0 auto' }}>מיצירת תוכן בעברית ועד פרסום אוטומטי — SociMe מכסה את כל הצרכים שלך.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 glow-card reveal transition-transform cursor-default"
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'var(--purple-soft)', border: '1px solid var(--purple-border)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              </div>
              <div className="text-lg font-bold mb-2" style={{ color: 'var(--text-dark)' }}>בנק רעיונות לוידאו</div>
              <div className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-mid)' }}>רעיונות ספציפיים לוידאו עם הנחיות צילום מפורטות — בדיוק לתחום העסק שלך.</div>
              <div className="flex flex-col gap-2">
                {[{ n: 1, title: 'טיפ של 60 שניות', desc: 'zoom-in, תאורה טבעית' }, { n: 2, title: 'Before & After', desc: 'split screen, כתוביות גדולות' }, { n: 3, title: 'Day in the Life', desc: 'B-roll, voiceover, CTA' }].map(i => (
                  <div key={i.n} className="flex items-center gap-3 p-3 rounded-xl text-sm"
                    style={{ background: '#FAFAFE', border: '1px solid rgba(161,70,255,0.1)', color: 'var(--text-mid)' }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))' }}>{i.n}</div>
                    <div><strong style={{ color: 'var(--text-dark)' }}>{i.title}:</strong> {i.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 glow-card reveal transition-transform cursor-default" style={{ transitionDelay: '0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'var(--purple-soft)', border: '1px solid var(--purple-border)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="text-lg font-bold mb-2" style={{ color: 'var(--text-dark)' }}>תזמון אוטומטי ל-Meta</div>
              <div className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-mid)' }}>טיוטות מאושרות מתפרסמות ישירות ל-Facebook ו-Instagram בזמן האופטימלי.</div>
              <div className="flex flex-col gap-2">
                {[
                  { status: 'פורסם', cls: 'bg-green-50 text-green-700', title: 'פוסט פתיחת עסק 🎉', meta: 'היום 10:00', ps: ['f', 'ig'] },
                  { status: 'מתוזמן', cls: 'bg-blue-50 text-blue-700', title: 'טיפ שבועי', meta: 'מחר 18:30', ps: ['ig'] },
                  { status: 'טיוטה', cls: 'bg-amber-50 text-amber-700', title: 'מבצע סוף שבוע', meta: 'ממתין לאישור', ps: ['f'] },
                  { status: 'נכשל', cls: 'bg-red-50 text-red-600', title: 'תוכן לחג השבועות', meta: 'שגיאת Token', ps: ['f', 'ig'] },
                ].map(item => (
                  <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl text-sm"
                    style={{ background: '#FAFAFE', border: '1px solid rgba(161,70,255,0.1)' }}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${item.cls}`}>{item.status}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate" style={{ color: 'var(--text-dark)' }}>{item.title}</div>
                      <div className="text-xs" style={{ color: 'var(--text-light)' }}>{item.meta}</div>
                    </div>
                    <div className="flex gap-1">
                      {item.ps.map(p => (
                        <div key={p} className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: p === 'f' ? '#1877F2' : 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)' }}>{p}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20 reveal">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--purple)' }}>מחירים</div>
            <h2 className="text-4xl font-extrabold mb-4" style={{ letterSpacing: '-1.2px', color: 'var(--text-dark)' }}>פשוט, שקוף, בלי הפתעות</h2>
            <p className="text-base" style={{ color: 'var(--text-mid)' }}>ביטול בכל עת, ללא התחייבות.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'חינמי', price: '0', period: 'לנצח בחינם', popular: false,
                features: ['5 פוסטים לחודש', 'Facebook + Instagram', 'תמיכה בעברית'],
                btn: 'התחל עכשיו', btnStyle: 'outline'
              },
              {
                name: 'פרו', price: '149', period: 'לחודש', popular: true,
                features: ['100 פוסטים לחודש', 'כל הפלטפורמות', 'תזמון מתקדם', 'תמיכה עדיפה'],
                btn: 'התחל 14 יום חינם', btnStyle: 'filled'
              },
              {
                name: 'ארגוני', price: '490', period: 'לחודש', popular: false,
                features: ['פוסטים ללא הגבלה', 'מספר חשבונות', 'API מותאם אישית', 'SLA מובטח'],
                btn: 'צור קשר', btnStyle: 'outline'
              },
            ].map((plan) => (
              <div key={plan.name}
                className="rounded-3xl p-7 relative transition-all cursor-default reveal"
                style={{
                  background: plan.popular ? 'linear-gradient(145deg,rgba(161,70,255,0.06),white)' : 'white',
                  border: plan.popular ? '1.5px solid rgba(161,70,255,0.3)' : '1px solid rgba(161,70,255,0.12)',
                  boxShadow: plan.popular ? '0 0 40px rgba(161,70,255,0.12), 0 4px 20px rgba(0,0,0,0.03)' : '0 2px 12px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))' }}>
                    הכי פופולרי
                  </div>
                )}
                <div className="text-sm font-semibold mb-3 mt-2" style={{ color: 'var(--text-light)' }}>{plan.name}</div>
                <div className="text-4xl font-black mb-1 tracking-tight" style={{ color: plan.popular ? 'var(--purple)' : 'var(--text-dark)' }}>
                  <sup className="text-xl font-bold" style={{ verticalAlign: 'super', fontSize: '1.1rem' }}>₪</sup>{plan.price}
                </div>
                <div className="text-xs mb-6" style={{ color: 'var(--text-light)' }}>{plan.period}</div>
                <ul className="flex flex-col gap-2 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-mid)' }}>
                      <span style={{ color: 'var(--purple)', fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
                  style={plan.btnStyle === 'filled'
                    ? { background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', color: 'white', boxShadow: '0 0 20px rgba(161,70,255,0.25)' }
                    : { background: 'white', color: 'var(--text-mid)', border: '1px solid rgba(161,70,255,0.2)' }
                  }
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    if (plan.btnStyle === 'filled') el.style.boxShadow = '0 4px 24px rgba(161,70,255,0.4)'
                    else { el.style.borderColor = 'rgba(161,70,255,0.4)'; el.style.color = 'var(--purple)' }
                    el.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    if (plan.btnStyle === 'filled') el.style.boxShadow = '0 0 20px rgba(161,70,255,0.25)'
                    else { el.style.borderColor = 'rgba(161,70,255,0.2)'; el.style.color = 'var(--text-mid)' }
                    el.style.transform = ''
                  }}
                >
                  {plan.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="py-16 px-6 bg-white" style={{ borderTop: '1px solid rgba(161,70,255,0.1)' }}>
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="SociMe" width={40} height={40} className="rounded-2xl"
              style={{ boxShadow: '0 0 16px rgba(161,70,255,0.25)' }} />
            <span className="text-xl font-black" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
              Soci<span style={{ color: 'var(--purple)' }}>Me</span>
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-light)' }}>AI-Powered Social Media Manager · Made in Israel 🇮🇱</p>
          <div className="flex justify-center gap-6 flex-wrap">
            {["ראשי", "אודות", "פיצ'רים", "תנאי שימוש", "פרטיות"].map(link => (
              <a key={link} href="#" className="text-sm transition-colors"
                style={{ color: 'var(--text-light)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--purple)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-light)' }}>
                {link}
              </a>
            ))}
          </div>
          <div className="text-xs" style={{ color: 'rgba(136,136,168,0.5)' }}>© 2025 SociMe · כל הזכויות שמורות לדור דוד אדרי</div>
          <div className="text-xs mt-1" style={{ color: 'rgba(136,136,168,0.4)' }}>Built by <span style={{ fontWeight: 600, color: '#9333EA', opacity: 0.7 }}>EDRI GROUP</span></div>
        </div>
      </footer>
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  )
}
