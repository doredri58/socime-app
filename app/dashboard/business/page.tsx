import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import BusinessProfileEditor from '@/components/dashboard/BusinessProfileEditor'

export default async function BusinessPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')
  const db = createServiceClient()

  const { data: profile } = await db
    .from('business_profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#fff', letterSpacing: '-0.5px' }}>
        תיק עסק
      </h1>
      <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.45)' }}>
        המידע הזה מזין את ה-AI שכותב את הפוסטים שלך
      </p>

      <BusinessProfileEditor userId={user!.id} initialProfile={profile} />
    </div>
  )
}
