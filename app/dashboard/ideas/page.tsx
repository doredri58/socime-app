import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import IdeasBank from '@/components/dashboard/IdeasBank'

export default async function IdeasPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#fff', letterSpacing: '-0.5px' }}>
        בנק רעיונות
      </h1>
      <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.45)' }}>
        AI מגנרל רעיונות — שמור את המוצלחים בסוויפ
      </p>
      <IdeasBank />
    </div>
  )
}
