import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard'

export default async function IdeasPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')
  const db = createServiceClient()

  // fetch scheduler posts for real analytics
  const { data: posts } = await db
    .from('scheduler')
    .select('id, content_text, platform, status, scheduled_at, created_at, hashtags')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: profile } = await db
    .from('users')
    .select('name, token_balance, tier')
    .eq('id', user.id)
    .single()

  return (
    <AnalyticsDashboard
      posts={posts ?? []}
      userName={profile?.name ?? ''}
      tier={profile?.tier ?? 'free'}
      tokenBalance={profile?.token_balance ?? 0}
    />
  )
}
