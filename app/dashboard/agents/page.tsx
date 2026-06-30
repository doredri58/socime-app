import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import ProAgents from '@/components/dashboard/ProAgents'

export default async function AgentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  const db = createServiceClient()
  const { data: profile } = await db.from('users').select('tier').eq('id', user.id).single()
  const isPro = ['pro', 'agency'].includes(profile?.tier ?? 'free')

  return <ProAgents isPro={isPro} />
}
