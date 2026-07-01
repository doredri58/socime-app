import type { ComponentProps } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getActiveBusiness } from '@/lib/business'
import BusinessPortfolio from '@/components/dashboard/BusinessPortfolio'

export default async function BusinessPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  // Supabase returns nullable fields; the component reads them with `?? ''`.
  const profile = await getActiveBusiness(user.id) as ComponentProps<typeof BusinessPortfolio>['initialProfile']

  return <BusinessPortfolio userId={user.id} initialProfile={profile} />
}
