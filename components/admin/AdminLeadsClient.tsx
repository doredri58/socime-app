'use client'
import { useMemo, useState } from 'react'

/* ── light admin theme tokens (match the rest of /admin) ── */
const ACCENT = '#1A73E8', GREEN = '#0F9E60', BG = '#FFFFFF', BD = '#E2E8F0'
const TEXT = '#0F172A', TEXT_MID = '#475569', TEXT_LOW = '#94A3B8', BG_PAGE = '#F8FAFD'

interface Lead {
  id: string
  email: string
  pain_point: string | null
  generated_post: string | null
  source: string
  emailed: boolean
  created_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function toCsv(rows: Lead[]) {
  const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`
  const head = ['תאריך', 'אימייל', 'כאב/תיאור', 'נשלח מייל', 'מקור']
  const body = rows.map(l => [fmtDate(l.created_at), l.email, l.pain_point ?? '', l.emailed ? 'כן' : 'לא', l.source].map(esc).join(','))
  return '﻿' + [head.map(esc).join(','), ...body].join('\n')  // BOM for Hebrew in Excel
}

export default function AdminLeadsClient({ leads }: { leads: Lead[] }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Lead | null>(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return leads
    return leads.filter(l =>
      l.email.toLowerCase().includes(s) || (l.pain_point ?? '').toLowerCase().includes(s)
    )
  }, [q, leads])

  const emailedCount = leads.filter(l => l.emailed).length

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `socime-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ direction: 'rtl' }}>
      {/* header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, color: TEXT, margin: '0 0 3px' }}>לידים מדף הנחיתה</h1>
        <div style={{ fontSize: 11, color: TEXT_LOW }}>מבקרים שביקשו את הפוסט המלא במייל דרך ההדגמה החיה</div>
      </div>

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'סה"כ לידים', val: leads.length, color: ACCENT },
          { label: 'נשלח להם מייל', val: emailedCount, color: GREEN },
          { label: 'ממתינים לשליחה', val: leads.length - emailedCount, color: '#F9AB00' },
        ].map(s => (
          <div key={s.label} style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: 'monospace', lineHeight: 1 }}>{s.val.toLocaleString('he-IL')}</div>
            <div style={{ fontSize: 11, color: TEXT_LOW, marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <i className="ti ti-search" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: TEXT_LOW }} />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="חיפוש לפי אימייל או תיאור..."
            style={{ width: '100%', padding: '9px 34px 9px 12px', borderRadius: 10, fontSize: 12, color: TEXT, background: BG, border: `1px solid ${BD}`, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={exportCsv} disabled={filtered.length === 0} style={{
          padding: '9px 16px', borderRadius: 10, cursor: filtered.length ? 'pointer' : 'not-allowed',
          fontSize: 12, fontWeight: 800, background: 'rgba(15,158,96,0.08)', border: '1px solid rgba(15,158,96,0.25)',
          color: GREEN, display: 'flex', alignItems: 'center', gap: 6, opacity: filtered.length ? 1 : 0.5,
        }}>
          <i className="ti ti-download" style={{ fontSize: 14 }} /> ייצוא CSV
        </button>
      </div>

      {/* table */}
      <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1.4fr 90px', gap: 12, padding: '11px 18px', background: BG_PAGE, borderBottom: `1px solid ${BD}`, fontSize: 11, fontWeight: 800, color: TEXT_MID }}>
          <div>תאריך</div><div>אימייל</div><div>כאב / תיאור</div><div>סטטוס</div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 18px', textAlign: 'center', color: TEXT_LOW, fontSize: 13 }}>
            {leads.length === 0 ? 'עדיין אין לידים. ברגע שמבקר ישאיר מייל בהדגמה — הוא יופיע כאן.' : 'אין תוצאות לחיפוש.'}
          </div>
        ) : filtered.map(l => (
          <div key={l.id}
            onClick={() => setOpen(l)}
            style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1.4fr 90px', gap: 12, padding: '12px 18px', borderBottom: `1px solid ${BD}`, fontSize: 12, color: TEXT, alignItems: 'center', cursor: 'pointer' }}
            className="admin-lead-row"
          >
            <div style={{ color: TEXT_MID, fontFamily: 'monospace', fontSize: 11 }}>{fmtDate(l.created_at)}</div>
            <div style={{ fontWeight: 700, direction: 'ltr', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.email}</div>
            <div style={{ color: TEXT_MID, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.pain_point || '—'}</div>
            <div>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                background: l.emailed ? 'rgba(15,158,96,0.1)' : 'rgba(249,171,0,0.1)',
                color: l.emailed ? GREEN : '#B7791F',
                border: `1px solid ${l.emailed ? 'rgba(15,158,96,0.25)' : 'rgba(249,171,0,0.25)'}`,
              }}>{l.emailed ? 'נשלח' : 'ממתין'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* detail modal */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 520, maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', background: BG, borderRadius: 16, border: `1px solid ${BD}`, padding: 24, direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, direction: 'ltr', textAlign: 'right' }}>{open.email}</div>
                <div style={{ fontSize: 11, color: TEXT_LOW, marginTop: 2 }}>{fmtDate(open.created_at)} · {open.emailed ? 'המייל נשלח' : 'ממתין לשליחה'}</div>
              </div>
              <button onClick={() => setOpen(null)} style={{ width: 30, height: 30, borderRadius: 8, background: BG_PAGE, border: `1px solid ${BD}`, cursor: 'pointer', color: TEXT_MID }}>
                <i className="ti ti-x" />
              </button>
            </div>
            {open.pain_point && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: TEXT_LOW, marginBottom: 5 }}>מה שהזין המבקר</div>
                <div style={{ fontSize: 13, color: TEXT, background: BG_PAGE, border: `1px solid ${BD}`, borderRadius: 10, padding: '10px 12px' }}>{open.pain_point}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: TEXT_LOW, marginBottom: 5 }}>הפוסט שנוצר</div>
              <div style={{ fontSize: 13, color: TEXT, background: BG_PAGE, border: `1px solid ${BD}`, borderRadius: 10, padding: '12px 14px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {open.generated_post || '(לא נשמר פוסט)'}
              </div>
            </div>
            <a href={`mailto:${open.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, padding: '9px 18px', borderRadius: 10, background: ACCENT, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 800 }}>
              <i className="ti ti-mail" style={{ fontSize: 14 }} /> שלח מייל ידני
            </a>
          </div>
        </div>
      )}

      <style>{`.admin-lead-row:hover { background: #F8FAFD; }`}</style>
    </div>
  )
}
