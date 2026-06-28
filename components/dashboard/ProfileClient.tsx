'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  free:  { label: 'חינמי',  color: '#6b7280', bg: '#f3f4f6' },
  basic: { label: 'Basic',  color: '#1d4ed8', bg: '#dbeafe' },
  pro:   { label: 'Pro',    color: '#7c3aed', bg: '#ede9fe' },
}

interface Profile {
  id: string
  email: string
  name: string
  role: string
  plan: string
  tier: string
  token_balance: number
  created_at: string
}

interface Transaction {
  amount_paid_ils: number
  tokens_granted: number
  created_at: string
}

export default function ProfileClient({
  profile,
  transactions,
}: {
  profile: Profile | null
  transactions: Transaction[]
}) {
  const router = useRouter()
  const [name, setName] = useState(profile?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const plan = PLAN_META[profile?.plan ?? 'free'] ?? PLAN_META.free

  async function saveName() {
    setSavingName(true)
    setNameMsg('')
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setSavingName(false)
    setNameMsg(res.ok ? '✓ נשמר' : '✗ שגיאה בשמירה')
    setTimeout(() => setNameMsg(''), 3000)
  }

  async function deleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) {
      await fetch('/auth/signout')
      router.push('/')
    } else {
      setDeleting(false)
      setDeleteConfirm(false)
      alert('שגיאה במחיקת החשבון, נסה שוב')
    }
  }

  async function upgradePlan(plan: 'basic' | 'pro') {
    const res = await fetch('/api/payplus/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile?.id, plan, email: profile?.email }),
    })
    const data = await res.json()
    if (data.paymentUrl) window.location.href = data.paymentUrl
  }

  if (!profile) return <div className="text-center py-12" style={{ color: 'var(--text-light)' }}>לא נמצא פרופיל</div>

  return (
    <div className="flex flex-col gap-5">

      {/* פרטים אישיים */}
      <section className="bg-white rounded-3xl p-6" style={{ border: '1px solid var(--purple-border)' }}>
        <h2 className="text-base font-extrabold mb-5" style={{ color: 'var(--text-dark)' }}>פרטים אישיים</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-light)' }}>שם</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor: 'var(--purple-border)', color: 'var(--text-dark)' }}
              />
              <button
                onClick={saveName}
                disabled={savingName || name === profile.name}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', opacity: savingName ? 0.7 : 1 }}
              >
                {savingName ? '...' : 'שמור'}
              </button>
            </div>
            {nameMsg && <p className="text-xs mt-1.5 font-semibold" style={{ color: nameMsg.startsWith('✓') ? '#16a34a' : '#dc2626' }}>{nameMsg}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-light)' }}>אימייל</label>
            <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: '#f8f4ff', color: 'var(--text-dark)' }}>{profile.email}</div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-light)' }}>חבר מאז</label>
            <div className="text-sm" style={{ color: 'var(--text-dark)' }}>
              {new Date(profile.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </section>

      {/* מנוי וטוקנים */}
      <section className="bg-white rounded-3xl p-6" style={{ border: '1px solid var(--purple-border)' }}>
        <h2 className="text-base font-extrabold mb-5" style={{ color: 'var(--text-dark)' }}>מנוי</h2>
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: plan.bg, color: plan.color }}>
              פלאן {plan.label}
            </span>
            <div className="text-sm mt-2" style={{ color: 'var(--text-dark)' }}>
              <span className="font-bold" style={{ color: 'var(--purple)' }}>{profile.token_balance}</span> טוקנים נותרו
            </div>
          </div>
        </div>

        {profile.plan !== 'pro' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs mb-2" style={{ color: 'var(--text-light)' }}>שדרג לקבל יותר טוקנים ותכונות</p>
            {profile.plan === 'free' && (
              <button onClick={() => upgradePlan('basic')}
                className="w-full py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                שדרג ל-Basic — ₪49 / חודש
              </button>
            )}
            <button onClick={() => upgradePlan('pro')}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))' }}>
              שדרג ל-Pro — ₪99 / חודש
            </button>
          </div>
        )}
      </section>

      {/* היסטוריית תשלומים */}
      {transactions.length > 0 && (
        <section className="bg-white rounded-3xl p-6" style={{ border: '1px solid var(--purple-border)' }}>
          <h2 className="text-base font-extrabold mb-4" style={{ color: 'var(--text-dark)' }}>היסטוריית תשלומים</h2>
          <div className="flex flex-col gap-2">
            {transactions.map((t, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 text-sm"
                style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--purple-border)' : 'none' }}>
                <span style={{ color: 'var(--text-light)' }}>
                  {new Date(t.created_at).toLocaleDateString('he-IL')}
                </span>
                <span style={{ color: 'var(--purple)', fontWeight: 600 }}>{t.tokens_granted} טוקנים</span>
                <span className="font-bold" style={{ color: 'var(--text-dark)' }}>₪{t.amount_paid_ils}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* מחיקת חשבון */}
      <section className="bg-white rounded-3xl p-6" style={{ border: '1px solid #fee2e2' }}>
        <h2 className="text-base font-extrabold mb-2" style={{ color: '#dc2626' }}>מחיקת חשבון</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-light)' }}>
          מחיקה היא פעולה בלתי הפיכה. כל הנתונים שלך יימחקו לצמיתות.
        </p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: '#fee2e2', color: '#dc2626' }}>
            מחק את החשבון שלי
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold" style={{ color: '#dc2626' }}>האם אתה בטוח לחלוטין?</p>
            <div className="flex gap-2">
              <button onClick={deleteAccount} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#dc2626', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'מוחק...' : 'כן, מחק הכל'}
              </button>
              <button onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#f3f4f6', color: 'var(--text-dark)' }}>
                ביטול
              </button>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
