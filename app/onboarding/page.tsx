'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Onboarding from '@/components/Onboarding'

function OnboardingInner() {
  const params = useSearchParams()
  const uid = params.get('uid') || ''

  if (!uid) {
    if (typeof window !== 'undefined') window.location.href = '/login'
    return null
  }

  return (
    <Onboarding
      userId={uid}
      onComplete={() => { window.location.href = '/dashboard' }}
    />
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  )
}
