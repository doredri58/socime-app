import { redirect }             from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import CommunityInbox               from '@/components/dashboard/CommunityInbox'

export default async function CommunityPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  return <CommunityInbox />
}
