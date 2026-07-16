'use client'
import { useEffect, useRef, useState } from 'react'

/* ── design tokens ────────────────────────────────────────────────────── */
const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'

interface Props {
  text: string
  title?: string
  onClose: () => void
}

const smallBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, background: 'rgba(250,250,252,0.08)',
  border: '1px solid rgba(250,250,252,0.12)', cursor: 'pointer', color: 'rgba(250,250,252,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

/* ── fullscreen auto-scrolling teleprompter (no camera — text only) ──── */
export default function Teleprompter({ text, title, onClose }: Props) {
  const [playing, setPlaying]   = useState(false)
  const [speed, setSpeed]       = useState(5)   // 1 (איטי) – 10 (מהיר)
  const [fontSize, setFontSize] = useState(38)  // px
  const containerRef = useRef<HTMLDivElement>(null)

  // auto-scroll loop, driven by requestAnimationFrame so speed feels smooth
  useEffect(() => {
    if (!playing) return
    let raf: number
    const tick = () => {
      const el = containerRef.current
      if (el) {
        el.scrollTop += speed * 0.6
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) setPlaying(false) // reached the end
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed])

  function restart() {
    if (containerRef.current) containerRef.current.scrollTop = 0
    setPlaying(false)
  }

  // keyboard shortcuts: space = play/pause, esc = close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') { e.preventDefault(); setPlaying(p => !p) }
      if (e.code === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    /* A deliberately black island inside the light theme — you read this while
       filming, so it must stay black with large light text.
       Colours here are 250,250,252 / #FAFAFC rather than 255,255,255 / #fff ON
       PURPOSE: the light-theme transform in globals.css matches
       `[style*="color:#fff"]` and repainted this script slate-on-black, i.e.
       invisible — the whole feature was unusable. It is a descendant of
       #dash-content (position:fixed doesn't change the DOM tree), so the rules
       do reach it. Excluding it in CSS isn't possible: Lightning CSS strips a
       `:not()` containing a complex selector. Keep these values as they are. */
    <div data-dark-surface style={{ position: 'fixed', inset: 0, zIndex: 400, background: '#000', display: 'flex', flexDirection: 'column', direction: 'rtl' }}>

      {/* top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', flexShrink: 0,
        background: 'rgba(250,250,252,0.03)', borderBottom: '1px solid rgba(250,250,252,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-microphone-2" style={{ fontSize: 16, color: PURPLE2 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FAFAFC' }}>{title ?? 'פרומפטר'}</span>
        </div>
        <button onClick={onClose} style={{
          width: 34, height: 34, borderRadius: 10, background: 'rgba(250,250,252,0.08)',
          border: 'none', cursor: 'pointer', color: 'rgba(250,250,252,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="ti ti-x" style={{ fontSize: 16 }} />
        </button>
      </div>

      {/* scrolling script text */}
      <div ref={containerRef} style={{
        flex: 1, overflowY: 'auto', position: 'relative',
        padding: '50vh 8%',
        maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
      }}>
        <p style={{ fontSize, fontWeight: 700, color: '#FAFAFC', lineHeight: 1.7, textAlign: 'center', whiteSpace: 'pre-wrap', margin: 0 }}>
          {text}
        </p>
      </div>

      {/* center reading guide line */}
      <div style={{ position: 'absolute', top: '50%', right: 0, left: 0, height: 1, background: 'rgba(150,86,254,0.35)', pointerEvents: 'none' }} />

      {/* bottom controls */}
      <div style={{
        flexShrink: 0, padding: '16px 24px 22px', background: 'rgba(250,250,252,0.03)',
        borderTop: '1px solid rgba(250,250,252,0.08)',
        display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <button onClick={restart} title="התחל מחדש" style={{
          width: 42, height: 42, borderRadius: '50%', background: 'rgba(250,250,252,0.08)',
          border: '1px solid rgba(250,250,252,0.12)', cursor: 'pointer', color: 'rgba(250,250,252,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="ti ti-rewind" style={{ fontSize: 16 }} />
        </button>

        <button onClick={() => setPlaying(p => !p)} title={playing ? 'השהה (רווח)' : 'הפעל (רווח)'} style={{
          width: 56, height: 56, borderRadius: '50%',
          background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
          border: 'none', cursor: 'pointer', color: '#FAFAFC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(150,86,254,0.5)',
        }}>
          <i className={`ti ${playing ? 'ti-player-pause-filled' : 'ti-player-play-filled'}`} style={{ fontSize: 22 }} />
        </button>

        {/* speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
          <i className="ti ti-gauge" style={{ fontSize: 15, color: 'rgba(250,250,252,0.4)' }} />
          <input type="range" min={1} max={10} value={speed} onChange={e => setSpeed(Number(e.target.value))}
            style={{ width: 110, accentColor: PURPLE2 }} />
          <span style={{ fontSize: 11, color: 'rgba(250,250,252,0.5)', width: 14, textAlign: 'center' }}>{speed}</span>
        </div>

        {/* font size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setFontSize(f => Math.max(20, f - 4))} style={smallBtn}>
            <i className="ti ti-minus" style={{ fontSize: 12 }} />
          </button>
          <i className="ti ti-text-size" style={{ fontSize: 15, color: 'rgba(250,250,252,0.4)' }} />
          <button onClick={() => setFontSize(f => Math.min(72, f + 4))} style={smallBtn}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} />
          </button>
        </div>
      </div>
    </div>
  )
}
