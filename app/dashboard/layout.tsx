import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?login=required')
  }

  // שליפת פרטי המשתמש מהטבלה
  const db = createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('name, tier, role')
    .eq('id', user.id)
    .single()

  const userName = profile?.name ?? user.email?.split('@')[0] ?? 'משתמש'
  const tier     = profile?.tier ?? 'free'
  const isAdmin  = ['admin', 'founder'].includes(profile?.role ?? '')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--dash-bg)' }}>
      <Sidebar userName={userName} tier={tier} isAdmin={isAdmin} />
      <main className="flex-1 min-w-0 p-6 md:p-10" style={{ direction: 'rtl' }}>
        {children}
      </main>
    </div>
  )
}
