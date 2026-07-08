import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { getActiveBusiness } from '@/lib/business'
import IdeasBank from '@/components/dashboard/IdeasBank'

export default async function BankPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('name, tier, token_balance')
    .eq('id', user.id)
    .single()

  const business = await getActiveBusiness(user.id)

  return (
    <IdeasBank
      userName={profile?.name ?? ''}
      tier={profile?.tier ?? 'free'}
      tokenBalance={profile?.token_balance ?? 0}
      businessName={business?.business_name ?? ''}
      businessType={business?.raw_description ?? ''}
    />
  )
}
