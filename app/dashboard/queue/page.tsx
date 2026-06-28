import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import CalendarView from '@/components/dashboard/CalendarView'

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ draft?: string; platform?: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')
  const db = createServiceClient()

  const { data: posts } = await db
    .from('scheduler')
    .select('id, content_text, hashtags, platform, status, scheduled_at, created_at, payload_url, content_type')
    .eq('user_id', user!.id)
    .order('scheduled_at', { ascending: true, nullsFirst: false })

  const params = await searchParams

  return (
    <CalendarView
      posts={posts ?? []}
      userId={user!.id}
      draftText={params.draft}
      draftPlatform={params.platform}
    />
  )
}
