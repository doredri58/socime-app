import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { getActiveBusiness } from '@/lib/business'
import IdeasBank, { type PostIdeaSeed, type VideoIdeaSeed } from '@/components/dashboard/IdeasBank'

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

  // cached_{post,video}_ideas are written by /api/ideas/generate; untyped jsonb
  // on the profile, so read defensively.
  const b = business as { cached_post_ideas?: unknown; cached_video_ideas?: unknown } | null
  const initialPostIdeas = Array.isArray(b?.cached_post_ideas) ? b.cached_post_ideas : []
  const initialVideoIdeas = Array.isArray(b?.cached_video_ideas) ? b.cached_video_ideas : []

  return (
    <IdeasBank
      userName={profile?.name ?? ''}
      tier={profile?.tier ?? 'free'}
      tokenBalance={profile?.token_balance ?? 0}
      businessName={business?.business_name ?? ''}
      businessType={business?.raw_description ?? ''}
      hasBusiness={!!business}
      initialPostIdeas={initialPostIdeas as PostIdeaSeed[]}
      initialVideoIdeas={initialVideoIdeas as VideoIdeaSeed[]}
    />
  )
}
