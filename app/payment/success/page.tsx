'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'

const PLAN_NAMES: Record<string, { label: string; tokens: number; price: number }> = {
  basic: { label: 'Basic',  tokens: 100, price: 49 },
  pro:   { label: 'Pro',    tokens: 300, price: 99 },
}

function SuccessInner() {
  const params  = useSearchParams()
  const plan    = params.get('plan') ?? 'basic'
  const config  = PLAN_NAMES[plan] ?? PLAN_NAMES.basic

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg,#f8f4ff 0%,#ffffff 60%)' }}>
      <div className="bg-white rounded-3xl p-10 text-center max-w-sm w-full"
        style={{ boxShadow: '0 8px 40px rgba(161,70,255,0.12)', border: '1px solid rgba(161,70,255,0.1)' }}>

        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>
          ✓
        </div>

        <Image src="/logo.png" alt="SociMe" width={40} height={40}
          className="rounded-xl mx-auto mb-4"
          style={{ boxShadow: '0 0 14px rgba(161,70,255,0.2)' }} />

        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#1A1A2E', letterSpacing: '-0.5px' }}>
          התשלום התקבל!
        </h1>
        <p className="text-sm mb-6" style={{ color: '#8888A8' }}>
          ברוך הבא לפלאן <strong style={{ color: '#a146ff' }}>SociMe {config.label}</strong>
        </p>

        <div className="rounded-2xl p-4 mb-6 text-right"
          style={{ background: 'linear-gradient(135deg,#f8f4ff,#fdf0ff)', border: '1px solid rgba(161,70,255,0.18)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs" style={{ color: '#8888A8' }}>פלאן</span>
            <span className="text-sm font-bold" style={{ color: '#1A1A2E' }}>SociMe {config.label}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs" style={{ color: '#8888A8' }}>טוקנים</span>
            <span className="text-sm font-bold" style={{ color: '#a146ff' }}>{config.tokens} טוקנים</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#8888A8' }}>שולם</span>
            <span className="text-sm font-bold" style={{ color: '#1A1A2E' }}>₪{config.price}</span>
          </div>
        </div>

        <a href="/dashboard"
          className="block w-full py-3 rounded-2xl text-white font-bold text-center transition-all"
          style={{ background: 'linear-gradient(135deg,#a146ff,#7c3aed)', boxShadow: '0 4px 18px rgba(161,70,255,0.3)' }}>
          כניסה לדשבורד ←
        </a>
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
