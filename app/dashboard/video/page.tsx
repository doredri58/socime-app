import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import VideoEditor from '@/components/dashboard/VideoEditor'

export default async function VideoPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('token_balance')
    .eq('id', user.id)
    .single()

  return <VideoEditor tokenBalance={profile?.token_balance ?? 0} />
}
