'use client'
import { useState, useEffect, useRef } from 'react'
import Drawer from '@/components/Drawer'
import ChatBot from '@/components/ChatBot'
import PaywallForm from '@/components/PaywallForm'

interface Draft { text: string; hashtags: string }

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
      })
    }, { threshold: 0.12 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const flipRef = useRef<HTMLDivElement>(null)
  useScrollReveal()

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
        className="fixed top-6 right-7 z-[100] w-12 h-12 rounded-2xl bg-white flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
        style={{ boxShadow: 'var(--purple-glow-sm)' }}
      >
        {[0,1,2].map(i => (
          <span key={i} className="block w-5 h-0.5 rounded-sm" style={{ background: 'var(--purple)' }}></span>
        ))}
      </button>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ══ HERO ══════════════════════════════════════ */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16">
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <svg className="w-full h-full" viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.045" fill="#A146FF">
              <circle cx="180" cy="200" r="55"/><circle cx="720" cy="160" r="42"/><circle cx="450" cy="320" r="65"/>
              <circle cx="120" cy="480" r="38"/><circle cx="800" cy="440" r="50"/><circle cx="340" cy="580" r="44"/><circle cx="640" cy="560" r="36"/>
              <line x1="180" y1="200" x2="450" y2="320" stroke="#A146FF" strokeWidth="2"/>
              <line x1="720" y1="160" x2="450" y2="320" stroke="#A146FF" strokeWidth="2"/>
              <line x1="450" y1="320" x2="120" y2="480" stroke="#A146FF" strokeWidth="2"/>
              <line x1="450" y1="320" x2="800" y2="440" stroke="#A146FF" strokeWidth="2"/>
              <line x1="120" y1="480" x2="340" y2="580" stroke="#A146FF" strokeWidth="2"/>
              <line x1="800" y1="440" x2="640" y2="560" stroke="#A146FF" strokeWidth="2"/>
            </g>
          </svg>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%,transparent 0%,rgba(255,255,255,0.97) 70%)' }}></div>
        </div>

        <div className="relative z-10 text-center max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-xs font-semibold" style={{ background: 'var(--purple-soft)', border: '1px solid rgba(161,70,255,0.18)', color: 'var(--purple)' }}>
            <span className="w-2 h-2 rounded-full pulse-dot inline-block" style={{ background: 'var(--purple)' }}></span>
            בינה מלאכותית לסושיאל מדיה
          </div>
          <h1 className="font-black leading-tight mb-5" style={{ fontSize: 'clamp(2.4rem,5.5vw,4rem)', letterSpacing: '-1.5px', color: '#1A1A2E' }}>
            נהל את הסושיאל שלך<br/>
            <span style={{ color: 'var(--purple)' }}>בלי להתאמץ</span>
          </h1>
          <p className="text-lg leading-relaxed mx-auto" style={{ color: '#4A4A6A', maxWidth: 520 }}>
            SociMe כותבת, מתזמנת ומפרסמת תוכן ל-Facebook ו-Instagram עבורך — תוך שניות, בעברית, עם AI חכם.
          </p>
        </div>

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

      {/* ══ STORY ════════════════════════════════════ */}
      <section id="story" className="py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid gap-14 md:grid-cols-2 items-center">
          <div className="reveal">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--purple)' }}>הסיפור שלנו</div>
            <h2 className="font-extrabold leading-tight mb-5" style={{ fontSize: 'clamp(1.9rem,3.5vw,2.8rem)', letterSpacing: '-0.8px', color: '#1A1A2E' }}>
              למה בניתי את <span style={{ color: 'var(--purple)' }}>SociMe</span>?
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#4A4A6A' }}>
              כשבעלי עסקים קטנים שאלו אותי "איך מצאת זמן לסושיאל?", התשובה הכנה היא שלא מצאתי — עד שבניתי כלי שעושה את זה עבורי.
              <br/><br/>
              SociMe נולדה מהצורך האמיתי של בעלי עסקים שמבינים שנוכחות דיגיטלית קריטית לצמיחה, אבל אין להם שעות פנויות ליצור תוכן כל יום.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[{ num: '97%', label: 'חסכון בזמן כתיבה' },{ num: '3x', label: 'יותר פוסטים בחודש' },{ num: '₪0', label: 'עלות קופירייטר' }].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 text-center glow-sm border cursor-default transition-all" style={{ border: '1.5px solid rgba(161,70,255,0.18)' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--purple-glow)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--purple-glow-sm)')}>
                  <div className="text-2xl font-black" style={{ color: 'var(--purple)' }}>{s.num}</div>
                  <div className="text-xs mt-1" style={{ color: '#4A4A6A' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal" style={{ transitionDelay: '0.15s' }}>
            <div className="bg-white rounded-3xl p-8 glow-card">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white mb-5" style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-light))', boxShadow: '0 4px 20px rgba(161,70,255,0.35)' }}>ד</div>
              <div className="text-xl font-extrabold mb-1" style={{ color: '#1A1A2E' }}>דור דוד אדרי</div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>מייסד ומפתח ראשי</div>
              <p className="text-sm leading-relaxed" style={{ color: '#4A4A6A' }}>
                יזם טכנולוגי וחובב AI, דור בנה את SociMe מתוך אמונה שכל עסק קטן בישראל ראוי לנוכחות דיגיטלית חזקה — בלי צורך בתקציב ענק.
                <br/><br/>
                בעל ניסיון בפיתוח Full-Stack ואינטגרציות Meta API, דור שם לב שהפתרונות הקיימים לא מתאימים לקצב ולשפה של העסק הישראלי.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════ */}
      <section id="features" className="py-28 px-6" style={{ background: '#FAFAFA' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--purple)' }}>כלים חכמים</div>
            <h2 className="text-4xl font-extrabold mb-4" style={{ letterSpacing: '-0.8px', color: '#1A1A2E' }}>הכל במקום אחד</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-7">
            {/* Video Ideas */}
            <div className="bg-white rounded-3xl p-8 glow-card reveal cursor-default transition-transform"
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'var(--purple-soft)', border: '1px solid rgba(161,70,255,0.18)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
              </div>
              <div className="text-lg font-bold mb-2" style={{ color: '#1A1A2E' }}>בנק רעיונות לוידאו</div>
              <div className="text-sm leading-relaxed mb-4" style={{ color: '#4A4A6A' }}>רעיונות ספציפיים לוידאו עם הנחיות צילום מפורטות — בדיוק לתחום העסק שלך.</div>
              <div className="flex flex-col gap-2">
                {[{n:1,title:'טיפ של 60 שניות',desc:'zoom-in, תאורה טבעית'},{n:2,title:'Before & After',desc:'split screen, כתוביות גדולות'},{n:3,title:'Day in the Life',desc:'B-roll, voiceover, CTA'}].map(i => (
                  <div key={i.n} className="flex items-center gap-3 p-3 rounded-xl text-sm border" style={{ background:'#FAFAFA', border:'1px solid rgba(161,70,255,0.12)', color:'#4A4A6A' }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background:'linear-gradient(135deg,var(--purple),var(--purple-light))' }}>{i.n}</div>
                    <div><strong style={{ color:'#1A1A2E' }}>{i.title}:</strong> {i.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduler */}
            <div className="bg-white rounded-3xl p-8 glow-card reveal cursor-default transition-transform" style={{ transitionDelay:'0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background:'var(--purple-soft)', border:'1px solid rgba(161,70,255,0.18)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="text-lg font-bold mb-2" style={{ color:'#1A1A2E' }}>תזמון אוטומטי ל-Meta</div>
              <div className="text-sm leading-relaxed mb-4" style={{ color:'#4A4A6A' }}>טיוטות מאושרות מתפרסמות ישירות ל-Facebook ו-Instagram בזמן האופטימלי.</div>
              <div className="flex flex-col gap-2">
                {[
                  { status:'פורסם', cls:'bg-green-100 text-green-700', title:'פוסט פתיחת עסק 🎉', meta:'היום 10:00', ps:['f','ig'] },
                  { status:'מתוזמן', cls:'bg-blue-100 text-blue-700', title:'טיפ שבועי', meta:'מחר 18:30', ps:['ig'] },
                  { status:'טיוטה', cls:'bg-yellow-100 text-yellow-700', title:'מבצע סוף שבוע', meta:'ממתין לאישור', ps:['f'] },
                  { status:'נכשל', cls:'bg-red-100 text-red-700', title:'תוכן לחג השבועות', meta:'שגיאת Token', ps:['f','ig'] },
                ].map(item => (
                  <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl border text-sm" style={{ background:'#FAFAFA', border:'1px solid rgba(161,70,255,0.12)' }}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${item.cls}`}>{item.status}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate" style={{ color:'#1A1A2E' }}>{item.title}</div>
                      <div className="text-xs" style={{ color:'#8888A8' }}>{item.meta}</div>
                    </div>
                    <div className="flex gap-1">
                      {item.ps.map(p => (
                        <div key={p} className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background:p==='f'?'#1877F2':'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)' }}>{p}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DB SCHEMA ═════════════════════════════════ */}
      <section id="schema" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 reveal">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:'var(--purple)' }}>תשתית Backend</div>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color:'#1A1A2E' }}>סכמת PostgreSQL</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name:'users', fields:[['id','UUID PK'],['email','TEXT'],['name','TEXT'],['plan','ENUM'],['token_balance','INT'],['created_at','TS'],['last_login_at','TS']] },
              { name:'transactions', fields:[['id','UUID PK'],['user_id','FK'],['transaction_type','ENUM'],['amount_paid_ils','DECIMAL'],['stripe_payment_id','TEXT'],['tokens_granted','INT'],['created_at','TS']] },
              { name:'token_ledger', fields:[['id','UUID PK'],['user_id','FK'],['tokens_used','INT'],['api_cost_usd','DECIMAL'],['action_type','ENUM'],['post_id','FK'],['created_at','TS']] },
              { name:'scheduler', fields:[['id','UUID PK'],['user_id','FK'],['content_text','TEXT'],['platform','TEXT[]'],['status','ENUM'],['scheduled_at','TS'],['published_at','TS'],['meta_post_id','TEXT']] },
            ].map((table, i) => (
              <div key={table.name} className="bg-white rounded-2xl overflow-hidden glow-sm border reveal" style={{ border:'1.5px solid rgba(161,70,255,0.18)', transitionDelay:`${i*0.08}s` }}>
                <div className="px-4 py-3 border-b" style={{ background:'var(--purple-soft)', borderColor:'rgba(161,70,255,0.18)' }}>
                  <span className="text-sm font-bold font-mono" style={{ color:'var(--purple)' }}>{table.name}</span>
                </div>
                <div className="py-1">
                  {table.fields.map(([name, type]) => (
                    <div key={name} className="flex items-center justify-between px-4 py-1.5 border-b last:border-b-0 text-xs" style={{ borderColor:'rgba(161,70,255,0.06)' }}>
                      <span className="font-semibold font-mono" style={{ color:'#1A1A2E' }}>{name}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-bold font-mono" style={{ background:'var(--purple-soft)', color:'var(--purple)' }}>{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════ */}
      <footer className="py-12 px-6 text-center" style={{ background:'#1A1A2E', color:'white' }}>
        <div className="text-3xl font-black mb-3" style={{ color:'var(--purple)' }}>SociMe</div>
        <div className="text-sm mb-8 opacity-50">AI-Powered Social Media Manager · Made in Israel 🇮🇱</div>
        <div className="flex justify-center gap-6 flex-wrap mb-8">
          {['ראשי','אודות','פיצ\'רים','מפתחים','תנאי שימוש','פרטיות'].map(link => (
            <a key={link} href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity" style={{ color:'white' }}>{link}</a>
          ))}
        </div>
        <div className="text-xs opacity-30">© 2025 SociMe · כל הזכויות שמורות לדור דוד אדרי</div>
      </footer>
    </>
  )
}
