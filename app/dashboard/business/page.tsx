import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import BusinessPortfolio from '@/components/dashboard/BusinessPortfolio'

export default async function BusinessPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <BusinessPortfolio userId={user.id} initialProfile={profile} />
}
