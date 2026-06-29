import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/?login=required')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('name, tier, role, token_balance')
    .eq('id', user.id)
    .single()

  const userName = profile?.name ?? user.email?.split('@')[0] ?? 'משתמש'
  const tier     = profile?.tier ?? 'free'
  const tokens   = profile?.token_balance ?? 0
  const isAdmin  = ['admin', 'founder'].includes(profile?.role ?? '')

  return (
    <>
      <style>{`
        body {
          background: var(--dash-body-bg, #0D0829) !important;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: -1;
          background: var(--dash-page-bg);
          pointer-events: none;
        }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
        background: 'var(--dash-page-bg)',
        color: 'var(--dash-sidebar-text-active)',
      }}>
        <TopBar userName={userName} tokens={tokens} tier={tier} />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar userName={userName} tier={tier} isAdmin={isAdmin} />
          <main style={{
            flex: 1, minWidth: 0,
            padding: '28px 32px',
            direction: 'rtl',
            background: 'transparent',
          }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
