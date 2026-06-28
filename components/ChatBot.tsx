'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'bot' | 'user'
  html: string
}

interface GeneratedPost {
  text: string
  hashtags: string
}

interface ChatBotProps {
  onPaywall: (draft: GeneratedPost) => void
}

export default function ChatBot({ onPaywall }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [postGenerated, setPostGenerated] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageCount = useRef(0)

  useEffect(() => {
    // Initial greeting
    setTimeout(() => {
      setMessages([{
        role: 'bot',
        html: 'שלום! 👋 אני SociMe AI. ספר לי על העסק שלך ואכתוב לך פוסט מושלם לסושיאל — בחינם!',
      }])
    }, 600)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    // Second message → trigger paywall
    if (messageCount.current >= 1 && postGenerated) {
      onPaywall(generatedPost!)
      return
    }

    setInput('')
    messageCount.current += 1
    setMessages(prev => [...prev, { role: 'user', html: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessDesc: text }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'bot', html: `שגיאה: ${data.error}` }])
        return
      }

      const { text: postText, hashtags, tokensUsed } = data
      setGeneratedPost({ text: postText, hashtags })

      const postHtml = `
        <div style="background:white;border:1.5px solid rgba(161,70,255,0.18);border-radius:16px;padding:16px;margin-top:4px;box-shadow:var(--purple-glow-sm)">
          <div style="font-size:0.72rem;font-weight:700;color:var(--purple);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">פוסט מוכן לפרסום</div>
          <div style="font-size:0.88rem;color:#1A1A2E;line-height:1.6;margin-bottom:8px">${postText.replace(/\n/g,'<br/>')}</div>
          <div style="font-size:0.82rem;color:var(--purple);font-weight:500">${hashtags}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
            <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:#DCFCE7;color:#16A34A;border-radius:50px;font-size:0.73rem;font-weight:600">
              ✓ נוצר על ידי Gemini AI
            </span>
            <span style="padding:4px 10px;background:#EDE9FE;color:#7C3AED;border-radius:50px;font-size:0.73rem;font-weight:600">${tokensUsed} טוקנים</span>
          </div>
        </div>
      `
      setMessages(prev => [...prev, { role: 'bot', html: postHtml }])
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          html: 'הפוסט מוכן! לחץ <strong>תזמן ל-Meta</strong> כדי לפרסם ישירות לפייסבוק ואינסטגרם 🚀',
        }])
      }, 400)

      setPostGenerated(true)
      setScheduleEnabled(true)
    } catch {
      setMessages(prev => [...prev, { role: 'bot', html: 'שגיאה בחיבור לשרת, נסה שוב.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl overflow-hidden w-full" style={{ background: 'rgba(13,8,41,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(152,80,255,0.1)' }}>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 text-right">
          <div className="text-sm font-bold" style={{ color: '#fff' }}>SociMe AI</div>
          <div className="text-xs font-medium flex items-center justify-end gap-1" style={{ color: '#22C55E' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot inline-block"></span>
            פעיל עכשיו
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-light))' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto p-4 flex flex-col gap-3" style={{ background: 'transparent' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 msg-in ${msg.role === 'bot' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={msg.role === 'bot'
                ? { background: 'linear-gradient(135deg,var(--purple),var(--purple-light))', color: 'white' }
                : { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }
              }>
              {msg.role === 'bot' ? 'AI' : 'אני'}
            </div>
            <div className="max-w-xs md:max-w-sm rounded-[18px] px-4 py-3 text-sm leading-relaxed"
              style={msg.role === 'bot'
                ? { background: 'linear-gradient(135deg,#9850FF,#BE56FF)', color: 'white', borderBottomRightRadius: 5 }
                : { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderBottomLeftRadius: 5 }
              }
              dangerouslySetInnerHTML={{ __html: msg.html }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 flex-row-reverse msg-in">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-light))', color: 'white' }}>
              AI
            </div>
            <div className="flex gap-1 items-center px-4 py-3 rounded-[18px]" style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-light))', borderBottomRightRadius: 5 }}>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex gap-2 px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
        <button
          disabled={!scheduleEnabled}
          onClick={() => generatedPost && onPaywall(generatedPost)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white whitespace-nowrap transition-all cursor-pointer"
          style={{
            background: 'linear-gradient(135deg,var(--purple),var(--purple-light))',
            boxShadow: '0 4px 14px rgba(161,70,255,0.35)',
            opacity: scheduleEnabled ? 1 : 0.45,
            cursor: scheduleEnabled ? 'pointer' : 'not-allowed',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          תזמן ל-Meta
        </button>

        <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-light))' }}
            aria-label="שלח"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={postGenerated ? 'רוצה עוד פוסט? הצטרף קודם...' : 'תאר לי את העסק שלך...'}
            dir="rtl"
            maxLength={300}
            className="flex-1 border-none bg-transparent text-sm outline-none text-right"
            style={{ color: '#fff' }}
          />
        </div>
      </div>
    </div>
  )
}
