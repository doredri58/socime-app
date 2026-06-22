'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import PaywallForm from '@/components/PaywallForm'

function LoginInner() {
  const params = useSearchParams()
  const mode = params.get('mode') === 'register' ? 'register' : 'login'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg,#f8f4ff 0%,#ffffff 60%)' }}>

      <a href="/" className="flex items-center gap-3 mb-8">
        <Image src="/logo.png" alt="SociMe" width={44} height={44} className="rounded-2xl"
          style={{ boxShadow: '0 0 18px rgba(161,70,255,0.28)' }} />
        <span className="text-2xl font-black" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
          Soci<span style={{ color: 'var(--purple)' }}>Me</span>
        </span>
      </a>

      <div className="w-full" style={{ maxWidth: 440 }}>
        <PaywallForm draftPost={null} initialMode={mode} onBack={() => { window.location.href = '/' }} />
      </div>
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
