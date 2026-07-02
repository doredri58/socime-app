import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, draftPost } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'שדות חסרים' }, { status: 400 })
    }

    const db = createServiceClient()

    // Create auth user. The public.users row is created by the DB trigger
    // handle_new_user (single source of truth for the welcome token grant);
    // full_name in the metadata is what the trigger uses for the name.
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (authError) {
      const msg = authError.message.includes('already registered')
        ? 'כתובת האימייל כבר רשומה במערכת'
        : authError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const userId = authData.user.id

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
