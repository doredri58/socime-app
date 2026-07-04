import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import BillingDashboard from '@/components/dashboard/BillingDashboard'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()

  const { data: profile } = await db
    .from('users')
    .select('id, email, name, role, plan, tier, token_balance, created_at, subscription_expires_at, card_brand, card_last4')
    .eq('id', user.id)
    .single()

  const { data: txns } = await db
    .from('transactions')
    .select('amount_paid_ils, tokens_granted, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: business } = await db
    .from('business_profiles')
    .select('business_name, company_id, address, phone')
    .eq('user_id', user.id)
    .single()

  return (
    <BillingDashboard
      profile={profile}
      transactions={txns ?? []}
      business={business}
    />
  )
}
