import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import PricingPlans from '@/components/pricing/PricingPlans'

export default async function UpgradePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  // 'section' variant → transparent, so the glass cards sit on the
  // dashboard's own gradient background instead of a flat black override.
  return <PricingPlans variant="section" />
}
