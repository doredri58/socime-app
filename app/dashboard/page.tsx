import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { getQuotaForTier } from '@/lib/image-quota'

export default async function DashboardHome() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')
  const db = createServiceClient()

  const { data: profile } = await db
    .from('users')
    .select('name, tier, token_balance, image_count_this_month')
    .eq('id', user!.id)
    .single()

  const { data: business } = await db
    .from('business_profiles')
    .select('business_name')
    .eq('user_id', user!.id)
    .single()

  const { count: queueCount } = await db
    .from('scheduler')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const quota     = getQuotaForTier(profile?.tier)
  const imgUsed   = profile?.image_count_this_month ?? 0
  const userName  = profile?.name ?? 'משתמש'

  const stats = [
    { label: 'יתרת טוקנים',  value: profile?.token_balance ?? 0, icon: '🪙', color: 'var(--purple)' },
    { label: 'תמונות החודש', value: `${imgUsed}/${quota}`,        icon: '🖼️', color: '#16a34a' },
    { label: 'פוסטים בתור',  value: queueCount ?? 0,              icon: '📅', color: '#2563eb' },
  ]

  const actions = [
    { href: '/dashboard/business', title: 'תיק עסק',     desc: business?.business_name ?? 'הגדר את העסק שלך', icon: '🏢' },
    { href: '/dashboard/create',   title: 'יצירת תוכן',  desc: 'פוסטים ותמונות עם AI',                       icon: '✨' },
    { href: '/dashboard/queue',    title: 'תור פוסטים',  desc: 'נהל את התזמון שלך',                          icon: '📅' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-1" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
        שלום {userName} 👋
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-light)' }}>
        {business?.business_name ? `מנהל את ${business.business_name}` : 'בוא נתחיל — הגדר את תיק העסק שלך'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid var(--purple-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-light)' }}>
        פעולות מהירות
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map(a => (
          <Link key={a.href} href={a.href}
            className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5"
            style={{ border: '1px solid var(--purple-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div className="text-3xl mb-3">{a.icon}</div>
            <div className="text-base font-bold mb-1" style={{ color: 'var(--text-dark)' }}>{a.title}</div>
            <div className="text-xs" style={{ color: 'var(--text-light)' }}>{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
