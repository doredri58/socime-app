import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import PricingPlans from '@/components/pricing/PricingPlans'

export default async function UpgradePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  return <PricingPlans />
}
