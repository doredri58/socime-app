'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import PaywallForm from '@/components/PaywallForm'

function LoginInner() {
  const params = useSearchParams()
  const mode = params.get('mode') === 'register' ? 'register' : 'login'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{ background: '#F9F7FF' }}>

      <a href="/" className="flex items-center gap-3 mb-8 group">
        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(109,40,217,0.12)' }}>
          <Image src="/logo.png" alt="SociMe" width={44} height={44} style={{ objectFit: 'cover' }} />
        </div>
        <span className="text-2xl font-black tracking-tight" style={{ color: '#111827' }}>
          Soci<span style={{ color: '#7C3AED' }}>Me</span>
        </span>
      </a>

      <div className="w-full" style={{ maxWidth: 440 }}>
        <PaywallForm draftPost={null} initialMode={mode} onBack={() => { window.location.href = '/' }} />
      </div>

      <p className="mt-6 text-xs" style={{ color: '#9CA3AF' }}>
        © 2025 SociMe · <span style={{ color: '#7C3AED', fontWeight: 600 }}>EDRI GROUP</span>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
