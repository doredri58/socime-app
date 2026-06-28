import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import CreateStudio from '@/components/dashboard/CreateStudio'

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ idea?: string; prompt?: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')
  const db = createServiceClient()

  const { data: business } = await db
    .from('business_profiles')
    .select('business_name, raw_description')
    .eq('user_id', user!.id)
    .single()

  const { data: profile } = await db
    .from('users')
    .select('name, token_balance')
    .eq('id', user!.id)
    .single()

  const params = await searchParams

  return (
    <CreateStudio
      userId={user!.id}
      businessName={business?.business_name ?? 'העסק שלי'}
      businessDescription={business?.raw_description ?? ''}
      userName={profile?.name ?? ''}
      tokenBalance={profile?.token_balance ?? 0}
      initialPrompt={params.prompt ?? params.idea ?? ''}
    />
  )
}
