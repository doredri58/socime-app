import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import TimingPanel from '@/components/dashboard/TimingPanel'

export default async function TimingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
        תזמון חכם
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--text-light)' }}>
        זמנים מומלצים לפרסום וחסימת תקופות כמו שבת וחגים
      </p>
      <TimingPanel />
    </div>
  )
}
