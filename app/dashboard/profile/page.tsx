import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import ProfileClient from '@/components/dashboard/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('id, email, name, role, plan, tier, token_balance, created_at')
    .eq('id', user.id)
    .single()

  const { data: txns } = await db
    .from('transactions')
    .select('amount_paid_ils, tokens_granted, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#fff', letterSpacing: '-0.5px' }}>
        פרופיל וחשבון
      </h1>
      <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.45)' }}>
        ניהול פרטים אישיים, מנוי ומחיקת חשבון
      </p>
      <ProfileClient profile={profile} transactions={txns ?? []} />
    </div>
  )
}
