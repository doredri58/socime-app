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
    { label: 'יתרת טוקנים',  value: profile?.token_balance ?? 0, icon: 'ti-coins',    grad: 'var(--card-purple)',  num: '#6D28D9' },
    { label: 'תמונות החודש', value: `${imgUsed}/${quota}`,        icon: 'ti-photo',    grad: 'var(--card-fuchsia)', num: '#A21CAF' },
    { label: 'פוסטים בתור',  value: queueCount ?? 0,              icon: 'ti-calendar', grad: 'var(--card-pink)',    num: '#BE185D' },
  ]

  const actions = [
    { href: '/dashboard/business', title: 'תיק עסק',    desc: business?.business_name ?? 'הגדר את העסק שלך', icon: 'ti-building-store' },
    { href: '/dashboard/create',   title: 'יצירת תוכן', desc: 'פוסטים ותמונות עם AI',                        icon: 'ti-sparkles'      },
    { href: '/dashboard/queue',    title: 'תור פוסטים', desc: 'נהל את התזמון שלך',                           icon: 'ti-calendar'      },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
        שלום {userName} 👋
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-light)' }}>
        {business?.business_name ? `מנהל את ${business.business_name}` : 'בוא נתחיל — הגדר את תיק העסק שלך'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-5"
            style={{ background: s.grad, border: '1px solid var(--purple-border)' }}>
            <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.num, marginBottom: 10, display: 'block' }} aria-hidden="true" />
            <div className="text-2xl font-bold" style={{ color: s.num }}>{s.value}</div>
            <div className="text-xs mt-1 font-medium" style={{ color: s.num, opacity: 0.7 }}>{s.label}</div>
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
            className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-1"
            style={{ border: '1px solid var(--purple-border)', boxShadow: '0 2px 16px rgba(124,58,237,0.06)', textDecoration: 'none' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'var(--purple-soft)' }}>
              <i className={`ti ${a.icon}`} style={{ fontSize: 20, color: 'var(--purple)' }} aria-hidden="true" />
            </div>
            <div className="text-base font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>{a.title}</div>
            <div className="text-xs" style={{ color: 'var(--text-light)' }}>{a.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
