import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, draftPost } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'שדות חסרים' }, { status: 400 })
    }

    const db = createServiceClient()

    // Create auth user
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) {
      const msg = authError.message.includes('already registered')
        ? 'כתובת האימייל כבר רשומה במערכת'
        : authError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const userId = authData.user.id

    // Insert into public.users — free tier, same welcome grant as OAuth signups.
    // (Previously granted plan:'pro' + 200 tokens + a fake ₪49 "subscription"
    // transaction that inflated admin revenue stats.)
    await db.from('users').insert({
      id: userId,
      email,
      name,
      role: 'user',
      plan: 'free',
      token_balance: 30,
    })

    // Save draft post if provided
    if (draftPost?.text) {
      await db.from('scheduler').insert({
        user_id: userId,
        content_text: draftPost.text,
        hashtags: draftPost.hashtags ?? '',
        platform: ['facebook', 'instagram'],
        status: 'draft',
      })
    }

    // התחברות אוטומטית — יוצר session cookie כדי שהמשתמש יהיה מחובר לדשבורד
    const authClient = await createServerSupabaseClient()
    await authClient.auth.signInWithPassword({ email, password })

    return NextResponse.json({ success: true, userId })
  } catch (err: unknown) {
    console.error('[/api/auth/register]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
