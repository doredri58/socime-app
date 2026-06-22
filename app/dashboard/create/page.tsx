import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import CreatePanel from '@/components/dashboard/CreatePanel'

export default async function CreatePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')
  const db = createServiceClient()

  const { data: business } = await db
    .from('business_profiles')
    .select('raw_description')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
        יצירת תוכן
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--text-light)' }}>
        פוסטים ותמונות מותאמים לעסק שלך — מבוססים על תיק העסק
      </p>

      <CreatePanel userId={user!.id} businessDescription={business?.raw_description ?? ''} />
    </div>
  )
}
