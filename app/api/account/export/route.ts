import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

// GET /api/account/export
// זכות ניידות (GDPR/חוק הגנת הפרטיות) — מחזיר את כל נתוני המשתמש כ-JSON להורדה.
// לא כולל סודות (הטוקנים המוצפנים של הרשתות) — רק סטטוס החיבור.
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const db = createServiceClient()
  const uid = user.id

  async function rows(table: string, select = '*') {
    try {
      const { data } = await db.from(table).select(select).eq('user_id', uid)
      return data ?? []
    } catch { return [] }
  }

  const [profile, businesses, transactions, posts, tokenLedger, images, ideas, notifications, socialConnections] =
    await Promise.all([
      db.from('users').select('id, email, name, role, plan, tier, token_balance, created_at, subscription_expires_at').eq('id', uid).single().then(r => r.data),
      rows('business_profiles', 'id, business_name, company_id, address, phone, billing_email, website, instagram, facebook, tiktok, target_audience, unique_value, tone_of_voice, account_type, created_at'),
      rows('transactions', 'amount_paid_ils, tokens_granted, transaction_type, created_at'),
      rows('scheduler'),
      rows('token_ledger', 'tokens_used, api_cost_usd, action_type, created_at'),
      rows('image_usage_log'),
      rows('saved_ideas'),
      rows('notifications'),
      // חיבורי רשתות — רק פלטפורמה וסטטוס, ללא הטוקן המוצפן
      rows('social_tokens', 'platform, scopes, expires_at, created_at'),
    ])

  const payload = {
    export_meta: {
      generated_at: new Date().toISOString(),
      account_email: user.email,
      note: 'ייצוא נתונים אישיים מ-SociMe. אינו כולל סיסמאות או טוקני גישה מוצפנים.',
    },
    profile,
    businesses,
    transactions,
    scheduled_posts: posts,
    token_ledger: tokenLedger,
    image_usage: images,
    saved_ideas: ideas,
    notifications,
    social_connections: socialConnections,
  }

  const filename = `socime-data-${new Date().toISOString().slice(0, 10)}.json`
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
