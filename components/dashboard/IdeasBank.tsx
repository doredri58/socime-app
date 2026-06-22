'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Idea { text: string; category: string }
interface SavedIdea extends Idea { id: string }

const CAT: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  value:     { label: 'תוכן ערך',  bg: '#dbeafe', color: '#1d4ed8', emoji: '📚' },
  marketing: { label: 'שיווק',     bg: '#dcfce7', color: '#16a34a', emoji: '🚀' },
  vibe:      { label: 'אווירה',    bg: '#fce7f3', color: '#be185d', emoji: '✨' },
}

const THRESHOLD = 80

export default function IdeasBank() {
  const [ideas, setIdeas]     = useState<Idea[]>([])
  const [idx, setIdx]         = useState(0)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState<SavedIdea[]>([])

  // drag state
  const [dragX, setDragX]     = useState(0)
  const [dragging, setDragging] = useState(false)
  const [animDir, setAnimDir] = useState<'left' | 'right' | null>(null)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/ideas').then(r => r.json()).then(d => setSaved(d.ideas ?? []))
  }, [])

  async function loadIdeas() {
    setLoading(true)
    setIdx(0)
    setDragX(0)
    setAnimDir(null)
    try {
      const res = await fetch('/api/ideas/generate', { method: 'POST' })
      const data = await res.json()
      setIdeas(data.ideas ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  // pointer handlers
  function onPointerDown(e: React.PointerEvent) {
    if (animDir) return
    setDragging(true)
    startX.current = e.clientX
    cardRef.current?.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return
    setDragX(e.clientX - startX.current)
  }
  async function onPointerUp() {
    if (!dragging) return
    setDragging(false)
    if (dragX > THRESHOLD) swipe('right')
    else if (dragX < -THRESHOLD) swipe('left')
    else setDragX(0)
  }

  async function swipe(dir: 'left' | 'right') {
    if (!current || animDir) return
    setAnimDir(dir)
    if (dir === 'right') {
      try {
        const res = await fetch('/api/ideas/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: current.text, category: current.category }),
        })
        const data = await res.json()
        if (data.idea) setSaved(prev => [data.idea, ...prev])
      } catch { /* ignore */ }
    }
    setTimeout(() => {
      setIdx(i => i + 1)
      setDragX(0)
      setAnimDir(null)
    }, 280)
  }

  const current = ideas[idx]
  const next    = ideas[idx + 1]

  const likeAlpha = Math.max(0, Math.min(1, dragX / THRESHOLD))
  const skipAlpha = Math.max(0, Math.min(1, -dragX / THRESHOLD))

  function frontStyle() {
    if (animDir === 'right') return { transform: 'translateX(120%) rotate(25deg)', transition: 'transform 0.28s ease' }
    if (animDir === 'left')  return { transform: 'translateX(-120%) rotate(-25deg)', transition: 'transform 0.28s ease' }
    return {
      transform: `translateX(${dragX}px) rotate(${dragX * 0.07}deg)`,
      transition: dragging ? 'none' : 'transform 0.3s ease',
      cursor: dragging ? 'grabbing' : 'grab',
    }
  }

  return (
    <div dir="rtl">

      {/* Empty state — generate button */}
      {ideas.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center mb-8"
          style={{ border: '1px solid var(--purple-border)' }}>
          <div className="text-5xl mb-4">💡</div>
          <div className="text-xl font-black mb-2" style={{ color: 'var(--text-dark)' }}>בנק רעיונות</div>
          <div className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
            AI יגנרל ~12 רעיונות לפוסטים בהתאם לעסק שלך.<br />
            החלק ימינה 💚 לשמור, שמאלה ✕ לדלג
          </div>
          <button onClick={loadIdeas} disabled={loading}
            className="px-8 py-3 rounded-2xl text-white font-bold text-sm"
            style={{
              background: loading ? '#c4b5fd' : 'linear-gradient(135deg,var(--purple),var(--purple-deep))',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(161,70,255,0.3)',
            }}>
            {loading ? '⏳ מגנרל רעיונות...' : '✨ גנרל רעיונות'}
          </button>
        </div>
      )}

      {/* Swipe deck */}
      {ideas.length > 0 && idx < ideas.length && (
        <>
          <div className="text-xs font-bold mb-4 text-center" style={{ color: 'var(--text-light)' }}>
            {idx + 1} / {ideas.length}
            <span className="mx-3" style={{ opacity: 0.3 }}>|</span>
            <span style={{ color: '#16a34a' }}>💚 ימינה לשמור</span>
            <span className="mx-2" style={{ opacity: 0.3 }}>·</span>
            <span style={{ color: '#dc2626' }}>✕ שמאלה לדלג</span>
          </div>

          {/* Card stack */}
          <div className="relative mx-auto mb-6" style={{ height: 300, maxWidth: 420 }}>

            {/* Back card */}
            {next && (
              <div className="absolute inset-0 rounded-3xl bg-white"
                style={{ transform: 'scale(0.95) translateY(10px)', zIndex: 0, opacity: 0.5, border: '1px solid var(--purple-border)' }} />
            )}

            {/* Front card */}
            <div
              ref={cardRef}
              className="absolute inset-0 rounded-3xl bg-white p-6 flex flex-col select-none"
              style={{ ...frontStyle(), zIndex: 1, border: '1px solid var(--purple-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' } as React.CSSProperties}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* Like overlay */}
              <div className="absolute inset-0 rounded-3xl flex items-center justify-center pointer-events-none"
                style={{ background: 'rgba(22,163,74,0.12)', opacity: likeAlpha }}>
                <span style={{ fontSize: 64, transform: 'rotate(12deg)' }}>💚</span>
              </div>
              {/* Skip overlay */}
              <div className="absolute inset-0 rounded-3xl flex items-center justify-center pointer-events-none"
                style={{ background: 'rgba(239,68,68,0.1)', opacity: skipAlpha }}>
                <span style={{ fontSize: 64, transform: 'rotate(-12deg)', color: '#dc2626', fontWeight: 900 }}>✕</span>
              </div>

              <div className="flex-1 flex flex-col justify-between pointer-events-none">
                <div>
                  {current.category && CAT[current.category] && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: CAT[current.category].bg, color: CAT[current.category].color }}>
                      {CAT[current.category].emoji} {CAT[current.category].label}
                    </span>
                  )}
                  <p className="mt-4 text-base leading-relaxed font-medium" style={{ color: 'var(--text-dark)' }}>
                    {current.text}
                  </p>
                </div>
                <p className="text-xs text-center" style={{ color: 'var(--text-light)' }}>
                  גרור או השתמש בכפתורים למטה
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <button onClick={() => swipe('left')} disabled={!!animDir}
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shadow-md transition-all hover:scale-110"
              style={{ background: '#fee2e2', color: '#dc2626', border: '2px solid #fca5a5' }}>✕</button>
            <button onClick={loadIdeas} disabled={loading || !!animDir}
              className="px-4 py-2 rounded-full text-xs font-bold"
              style={{ background: '#FAFAFE', color: 'var(--text-light)', border: '1px solid var(--purple-border)' }}>
              🔄 חדשים
            </button>
            <button onClick={() => swipe('right')} disabled={!!animDir}
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-md transition-all hover:scale-110"
              style={{ background: '#dcfce7', border: '2px solid #86efac' }}>💚</button>
          </div>
        </>
      )}

      {/* All done */}
      {ideas.length > 0 && idx >= ideas.length && (
        <div className="bg-white rounded-3xl p-10 text-center mb-8"
          style={{ border: '1px solid var(--purple-border)' }}>
          <div className="text-4xl mb-3">🎉</div>
          <div className="text-lg font-black mb-1" style={{ color: 'var(--text-dark)' }}>עברת על כל הרעיונות!</div>
          <div className="text-sm mb-5" style={{ color: 'var(--text-light)' }}>
            {saved.length} רעיונות נשמרו
          </div>
          <button onClick={loadIdeas} disabled={loading}
            className="px-6 py-2.5 rounded-2xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 4px 14px rgba(161,70,255,0.25)' }}>
            {loading ? '⏳ מגנרל...' : '✨ גנרל 12 רעיונות חדשים'}
          </button>
        </div>
      )}

      {/* Saved list */}
      {saved.length > 0 && (
        <>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-light)' }}>
            💾 רעיונות שמורים ({saved.length})
          </div>
          <div className="flex flex-col gap-3">
            {saved.map(idea => (
              <div key={idea.id} className="bg-white rounded-2xl p-4"
                style={{ border: '1px solid var(--purple-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {idea.category && CAT[idea.category] && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: CAT[idea.category].bg, color: CAT[idea.category].color }}>
                        {CAT[idea.category].emoji} {CAT[idea.category].label}
                      </span>
                    )}
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-dark)' }}>
                      {idea.text}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/create?idea=${encodeURIComponent(idea.text)}`}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-white whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))' }}>
                    ✨ צור פוסט
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
