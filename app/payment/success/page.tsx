'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'

const PLAN_NAMES: Record<string, { label: string; tokens: number; price: number }> = {
  basic: { label: 'Basic', tokens: 100, price: 49 },
  pro:   { label: 'Pro',   tokens: 300, price: 99 },
}

function SuccessInner() {
  const params = useSearchParams()
  const plan   = params.get('plan') ?? 'basic'
  const config = PLAN_NAMES[plan] ?? PLAN_NAMES.basic

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#F9F7FF' }}>

      <div className="text-center w-full" style={{ maxWidth: 400 }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EDE9FE',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 8px 40px rgba(109,40,217,0.08), 0 2px 12px rgba(0,0,0,0.05)',
        }}>
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
              fontSize: 32, color: '#fff', fontWeight: 800,
            }}>
            ✓
          </div>

          <div className="mx-auto mb-5 w-fit rounded-xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(109,40,217,0.1)' }}>
            <Image src="/logo.png" alt="SociMe" width={40} height={40} style={{ objectFit: 'cover' }} />
          </div>

          <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#111827', letterSpacing: '-0.5px' }}>
            התשלום התקבל!
          </h1>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
            ברוך הבא לפלאן{' '}
            <strong style={{ color: '#7C3AED' }}>SociMe {config.label}</strong>
          </p>

          {/* Receipt */}
          <div className="rounded-2xl p-4 mb-6 text-right"
            style={{ background: '#F9F7FF', border: '1px solid #EDE9FE' }}>
            {[
              { label: 'פלאן', value: `SociMe ${config.label}`, highlight: false },
              { label: 'טוקנים', value: `${config.tokens} טוקנים`, highlight: true },
              { label: 'שולם', value: `₪${config.price}`, highlight: false },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center mb-2 last:mb-0">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>{row.label}</span>
                <span className="text-sm font-bold"
                  style={{ color: row.highlight ? '#7C3AED' : '#111827' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <a href="/dashboard"
            className="block w-full py-3 rounded-xl text-white font-bold text-center transition-all"
            style={{ background: '#7C3AED', boxShadow: '0 4px 16px rgba(109,40,217,0.25)' }}
            onMouseEnter={e => {
              (e.currentTarget.style.background = '#6D28D9')
              ;(e.currentTarget.style.transform = 'translateY(-1px)')
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.background = '#7C3AED')
              ;(e.currentTarget.style.transform = '')
            }}>
            כניסה לדשבורד ←
          </a>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  )
}
