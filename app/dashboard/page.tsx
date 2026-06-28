import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { getQuotaForTier } from '@/lib/image-quota'
import { QuickActionList, FeatureGrid } from '@/components/dashboard/BentoCards'

export default async function DashboardHome() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')
  const db = createServiceClient()

  const [{ data: profile }, { data: business }, { count: queueCount }, { data: recentPosts }] =
    await Promise.all([
      db.from('users').select('name, tier, token_balance, image_count_this_month').eq('id', user!.id).single(),
      db.from('business_profiles').select('business_name, industry').eq('user_id', user!.id).single(),
      db.from('scheduler').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      db.from('scheduler').select('id, content, platform, scheduled_at, status').eq('user_id', user!.id).order('scheduled_at', { ascending: false }).limit(4),
    ])

  const quota    = getQuotaForTier(profile?.tier)
  const imgUsed  = profile?.image_count_this_month ?? 0
  const imgPct   = Math.min(Math.round((imgUsed / quota) * 100), 100)
  const tokens   = profile?.token_balance ?? 0
  const userName = profile?.name ?? 'משתמש'
  const tierLabel: Record<string, string> = { free: 'חינמי', basic: 'Basic', pro: 'Pro' }
  const tier     = profile?.tier ?? 'free'

  const platformIcon: Record<string, string> = {
    facebook: 'ti-brand-facebook',
    instagram: 'ti-brand-instagram',
    both: 'ti-brand-instagram',
  }

  const statusColor: Record<string, string> = {
    pending: '#A78BFA',
    approved: '#34D399',
    sent: '#60A5FA',
    failed: '#F87171',
  }

  const statusLabel: Record<string, string> = {
    pending: 'ממתין',
    approved: 'אושר',
    sent: 'נשלח',
    failed: 'נכשל',
  }

  const tips = [
    'פוסטים עם שאלות מקבלים 40% יותר תגובות — נסה לסיים בשאלה פתוחה.',
    'שעות הפריים בישראל: 19:00–21:00 בימי ראשון–חמישי.',
    'תמונות מקוריות מביאות פי 2.3 יותר שיתופים מאשר stock photos.',
    'קראסל (carousel) בינסטגרם מגדיל זמן שהייה ב-30% בממוצע.',
  ]
  const todayTip = tips[new Date().getDay() % tips.length]

  type SchedulerPost = {
    id: string
    content: string
    platform: string
    scheduled_at: string
    status: string
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
            שלום, {userName} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, marginBottom: 0 }}>
            {business?.business_name ? `מנהל את ${business.business_name}` : 'בוא נתחיל — הגדר את תיק העסק שלך'}
          </p>
        </div>
        <Link href="/dashboard/create" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '10px 22px', borderRadius: 999,
          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
          color: '#fff', fontSize: 13, fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
        }}>
          <i className="ti ti-sparkles" style={{ fontSize: 15 }} />
          צור תוכן עכשיו
        </Link>
      </div>

      {/* ══ ROW 1: Hero + Stats ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 16, marginBottom: 16 }}>

        {/* Hero Welcome Card */}
        <div style={{
          borderRadius: 24,
          padding: '28px 32px',
          background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 45%, #7C3AED 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(109,40,217,0.35)',
        }}>
          <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: 40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.15)',
                fontSize: 11, fontWeight: 700, color: '#E9D5FF', letterSpacing: '0.5px',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A3E635', display: 'inline-block' }} />
                {tierLabel[tier] ?? 'חינמי'} Plan
              </span>
              {business?.industry && (
                <span style={{
                  padding: '3px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  fontSize: 11, color: 'rgba(255,255,255,0.7)',
                }}>
                  {business.industry}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              {business?.business_name ? `${business.business_name} — מוכן לפרסם?` : 'ברוך הבא ל-SociMe'}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
              {business?.business_name
                ? 'הכנס ויצור תוכן שמדבר ישירות לקהל שלך, בעברית, עם AI.'
                : 'הגדר את תיק העסק שלך כדי שה-AI יכיר את המותג ויכתוב בשבילך.'}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <Link href={business?.business_name ? '/dashboard/create' : '/dashboard/business'} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 999,
                background: '#fff', color: '#5B21B6',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}>
                <i className={`ti ${business?.business_name ? 'ti-sparkles' : 'ti-building-store'}`} style={{ fontSize: 14 }} />
                {business?.business_name ? 'צור פוסט' : 'הגדר עסק'}
              </Link>
              <Link href="/dashboard/queue" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 999,
                background: 'rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <i className="ti ti-calendar" style={{ fontSize: 14 }} />
                תור הפוסטים
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Token Balance */}
          <div style={{
            borderRadius: 20, padding: '18px 22px', flex: 1,
            background: 'rgba(13,10,31,0.8)',
            border: '1px solid rgba(167,139,250,0.2)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>יתרת טוקנים</span>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-coins" style={{ fontSize: 14, color: '#A78BFA' }} />
              </div>
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#A78BFA', marginTop: 8, letterSpacing: '-1.5px', lineHeight: 1 }}>
              {tokens.toLocaleString('he-IL')}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>זמינים לשימוש</div>
          </div>

          {/* Image Quota */}
          <div style={{
            borderRadius: 20, padding: '18px 22px', flex: 1,
            background: 'rgba(13,10,31,0.8)',
            border: '1px solid rgba(192,132,252,0.2)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>תמונות החודש</span>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(192,132,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-photo" style={{ fontSize: 14, color: '#C084FC' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: '#C084FC', letterSpacing: '-1px' }}>{imgUsed}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>/ {quota}</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', marginTop: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${imgPct}%`,
                background: imgPct > 80
                  ? 'linear-gradient(90deg, #F87171, #EF4444)'
                  : 'linear-gradient(90deg, #A78BFA, #C084FC)',
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{imgPct}% נוצלו</div>
          </div>
        </div>
      </div>

      {/* ══ ROW 2: Quick Actions + Posts + Counter/Tip ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 5fr 3fr', gap: 16, marginBottom: 16 }}>

        {/* Quick Actions */}
        <QuickActionList actions={[
          { href: '/dashboard/create',   icon: 'ti-sparkles',        label: 'יצירת תוכן',    desc: 'פוסטים ותמונות עם AI',              color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
          { href: '/dashboard/business', icon: 'ti-building-store',  label: 'תיק עסק',       desc: business?.business_name ?? 'הגדר את העסק', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
          { href: '/dashboard/queue',    icon: 'ti-calendar-event',  label: 'תור פוסטים',    desc: `${queueCount ?? 0} פוסטים ממתינים`, color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
          { href: '/dashboard/social',   icon: 'ti-brand-instagram', label: 'רשתות חברתיות', desc: 'חבר פייסבוק ואינסטגרם',            color: '#F9A8D4', bg: 'rgba(249,168,212,0.1)' },
        ]} />

        {/* Recent Posts */}
        <div style={{
          borderRadius: 24,
          background: 'rgba(13,10,31,0.7)',
          border: '1px solid rgba(139,92,246,0.15)',
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>פוסטים אחרונים</h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>{queueCount ?? 0} פוסטים בתור</p>
            </div>
            <Link href="/dashboard/queue" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 12px', borderRadius: 999,
              background: 'rgba(139,92,246,0.15)',
              color: '#A78BFA', fontSize: 11, fontWeight: 600,
              textDecoration: 'none', border: '1px solid rgba(139,92,246,0.25)',
            }}>
              הכל <i className="ti ti-arrow-left" style={{ fontSize: 11 }} />
            </Link>
          </div>
          <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentPosts && recentPosts.length > 0 ? (recentPosts as SchedulerPost[]).map(post => (
              <div key={post.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${platformIcon[post.platform] ?? 'ti-brand-instagram'}`} style={{ fontSize: 14, color: '#A78BFA' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.content?.substring(0, 55) ?? '—'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {post.scheduled_at
                      ? new Date(post.scheduled_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : 'לא מתוזמן'}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                  background: `${statusColor[post.status] ?? '#A78BFA'}18`,
                  color: statusColor[post.status] ?? '#A78BFA',
                  border: `1px solid ${statusColor[post.status] ?? '#A78BFA'}30`,
                }}>
                  {statusLabel[post.status] ?? post.status}
                </span>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '28px 20px' }}>
                <i className="ti ti-calendar-off" style={{ fontSize: 30, color: 'rgba(255,255,255,0.12)' }} />
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: '8px 0 12px' }}>אין פוסטים עדיין</p>
                <Link href="/dashboard/create" style={{
                  display: 'inline-block', padding: '7px 16px', borderRadius: 999,
                  background: 'rgba(139,92,246,0.2)', color: '#A78BFA',
                  fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}>
                  צור את הפוסט הראשון
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Queue Counter + Tip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            borderRadius: 20, padding: '20px',
            background: 'rgba(13,10,31,0.7)',
            border: '1px solid rgba(249,168,212,0.18)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>בתור</span>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(249,168,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-calendar-event" style={{ fontSize: 14, color: '#F9A8D4' }} />
              </div>
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#F9A8D4', lineHeight: 1, letterSpacing: '-2px' }}>
              {queueCount ?? 0}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>פוסטים מתוזמנים</div>
          </div>

          <div style={{
            borderRadius: 20, padding: '18px 20px', flex: 1,
            background: 'linear-gradient(145deg, rgba(109,40,217,0.25), rgba(13,10,31,0.9))',
            border: '1px solid rgba(139,92,246,0.25)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <i className="ti ti-bulb" style={{ fontSize: 14, color: '#FCD34D' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FCD34D', letterSpacing: '0.5px' }}>טיפ היום</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: 0 }}>{todayTip}</p>
          </div>
        </div>
      </div>

      {/* ══ ROW 3: Secondary Features ══ */}
      <FeatureGrid items={[
        { icon: 'ti-upload',       label: 'העלאת מדיה',   cta: 'העלה קבצים',  href: '/dashboard/bulk',         color: '#60A5FA', desc: 'העלה תמונות וסרטונים בכמות גדולה לשימוש בפוסטים' },
        { icon: 'ti-bulb',        label: 'בנק רעיונות',  cta: 'הצג רעיונות', href: '/dashboard/ideas',         color: '#FCD34D', desc: 'רעיונות לתוכן המותאמים לעסק ולתעשייה שלך' },
        { icon: 'ti-clock',       label: 'תזמון חכם',    cta: 'תזמן פוסטים', href: '/dashboard/timing',        color: '#34D399', desc: 'גלה את השעות האידיאליות לפרסום לפי הנתונים' },
        { icon: 'ti-user-circle', label: 'פרופיל וחשבון', cta: 'ערוך פרופיל', href: '/dashboard/profile',       color: '#C084FC', desc: 'ערוך את פרטי החשבון, הסיסמה והחבילה שלך' },
      ]} />

    </div>
  )
}
