import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import IdeasBank from '@/components/dashboard/IdeasBank'

export default async function BankPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('name, plan, token_balance')
    .eq('id', user.id)
    .single()

  const { data: business } = await db
    .from('business_profiles')
    .select('business_name, business_type, raw_description')
    .eq('user_id', user.id)
    .single()

  return (
    <IdeasBank
      userName={profile?.name ?? ''}
      plan={profile?.plan ?? 'free'}
      tokenBalance={profile?.token_balance ?? 0}
      businessName={business?.business_name ?? ''}
      businessType={business?.business_type ?? ''}
    />
  )
}
