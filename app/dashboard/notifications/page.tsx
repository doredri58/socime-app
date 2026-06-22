import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
        התראות Push
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--text-light)' }}>
        קבל התראות ישירות לדפדפן — גם כשהאתר סגור
      </p>
      <NotificationsPanel />
    </div>
  )
}
