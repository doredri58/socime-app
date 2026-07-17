'use client'
import { useEffect, useState } from 'react'

interface Slot { datetime: string; label: string; score: number }
interface Blackout { id: string; label: string; start_datetime: string; end_datetime: string }

const PRESETS = [
  { label: 'שבת שבועית', start: nextShabbatStart(), end: nextShabbatEnd() },
]

function nextShabbatStart() {
  const d = new Date()
  const day = d.getDay()           // 0=Sun … 5=Fri … 6=Sat
  const daysToFri = (5 - day + 7) % 7 || 7
  const fri = new Date(d)
  fri.setDate(d.getDate() + daysToFri)
  fri.setHours(17, 30, 0, 0)
  return fri.toISOString().slice(0, 16)
}

function nextShabbatEnd() {
  const d = new Date()
  const day = d.getDay()
  const daysToSat = (6 - day + 7) % 7 || 7
  const sat = new Date(d)
  sat.setDate(d.getDate() + daysToSat)
  sat.setHours(21, 0, 0, 0)
  return sat.toISOString().slice(0, 16)
}

// AA-safe on the frosted card: raw Tailwind green-600/amber-600 were only
// 3.3 / 3.19:1. These are the same semantic values used elsewhere in the app.
function scoreColor(s: number) {
  if (s >= 90) return '#0A7159'   // green  5.17:1
  if (s >= 80) return '#8A6207'   // amber  4.74:1
  return '#6B6790'                // neutral 4.66:1
}

export default function TimingPanel() {
  const [slots, setSlots]         = useState<Slot[]>([])
  const [blackouts, setBlackouts] = useState<Blackout[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)

  // form state
  const [label, setLabel]   = useState('')
  const [start, setStart]   = useState('')
  const [end, setEnd]       = useState('')
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  useEffect(() => {
    fetch('/api/timing/suggest').then(r => r.json()).then(d => { setSlots(d.slots ?? []); setLoadingSlots(false) })
    fetch('/api/timing/blackout').then(r => r.json()).then(d => setBlackouts(d.blackouts ?? []))
  }, [])

  function applyPreset(p: typeof PRESETS[0]) {
    setLabel(p.label)
    setStart(p.start)
    setEnd(p.end)
  }

  async function addBlackout(e: React.FormEvent) {
    e.preventDefault()
    if (!start || !end) { setFormErr('בחרו תאריך התחלה וסיום'); return }
    setSaving(true); setFormErr('')
    const res = await fetch('/api/timing/blackout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label || 'חסימה', start_datetime: new Date(start).toISOString(), end_datetime: new Date(end).toISOString() }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setFormErr(data.error); return }
    setBlackouts(prev => [...prev, data.blackout].sort((a,b) => a.start_datetime.localeCompare(b.start_datetime)))
    setLabel(''); setStart(''); setEnd('')
    // refresh slots
    fetch('/api/timing/suggest').then(r => r.json()).then(d => setSlots(d.slots ?? []))
  }

  async function deleteBlackout(id: string) {
    await fetch('/api/timing/blackout', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setBlackouts(prev => prev.filter(b => b.id !== id))
    fetch('/api/timing/suggest').then(r => r.json()).then(d => setSlots(d.slots ?? []))
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Suggested slots */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-light)' }}>
          ⏱️ זמנים מומלצים לפרסום
        </div>
        {loadingSlots ? (
          <div className="text-sm" style={{ color: 'var(--text-light)' }}>טוען...</div>
        ) : slots.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center text-sm" style={{ border: '1px solid var(--purple-border)', color: 'var(--text-light)' }}>
            אין זמנים פנויים — כל הזמנים הקרובים חסומים
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {slots.map((slot, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 text-center"
                style={{ border: '1px solid var(--purple-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div className="text-xs font-bold mb-1" style={{ color: scoreColor(slot.score) }}>
                  {slot.score}% מתאים
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>{slot.label}</div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
          מחושב לפי עדיפות קהל ישראלי — בוקר, צהריים וערב · לא כולל זמני חסימה
        </p>
      </div>

      {/* Add blackout */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-light)' }}>
          🚫 הוסיפו תקופת חסימה
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid var(--purple-border)' }}>
          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map((p, i) => (
              <button key={i} onClick={() => applyPreset(p)}
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: 'var(--purple-soft)', color: 'var(--purple)', border: '1px solid var(--purple-border)' }}>
                + {p.label}
              </button>
            ))}
          </div>

          {formErr && <div className="p-2 rounded-lg mb-3 text-xs text-red-600 bg-red-50 border border-red-200">{formErr}</div>}

          <form onSubmit={addBlackout} className="flex flex-col gap-3" dir="rtl">
            <input type="text" placeholder="תווית (שבת, חג, חופשה...)" value={label}
              onChange={e => setLabel(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: '1.5px solid var(--purple-border)', background: '#FAFAFE', color: 'var(--text-dark)' }} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-light)' }}>התחלה</label>
                <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid var(--purple-border)', background: '#FAFAFE', color: 'var(--text-dark)' }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-light)' }}>סיום</label>
                <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid var(--purple-border)', background: '#FAFAFE', color: 'var(--text-dark)' }} />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: saving ? '#c4b5fd' : 'linear-gradient(135deg,var(--purple),var(--purple-deep))' }}>
              {saving ? 'שומר...' : '+ הוסיפו חסימה'}
            </button>
          </form>
        </div>
      </div>

      {/* Blackout list */}
      {blackouts.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-light)' }}>
            תקופות חסימה פעילות ({blackouts.length})
          </div>
          <div className="flex flex-col gap-2">
            {blackouts.map(b => (
              <div key={b.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between"
                style={{ border: '1px solid var(--purple-border)' }}>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>{b.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }} dir="ltr">
                    {new Date(b.start_datetime).toLocaleString('he-IL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    {' – '}
                    {new Date(b.end_datetime).toLocaleString('he-IL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
                <button onClick={() => deleteBlackout(b.id)}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: '#fee2e2', color: '#dc2626' }}>
                  מחק
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
