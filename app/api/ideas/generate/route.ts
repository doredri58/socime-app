import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { generateIdeas } from '@/lib/gemini'

const CATEGORIES = ['value', 'marketing', 'vibe'] as const

export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const db = createServiceClient()
  const { data: profile } = await db
    .from('business_profiles')
    .select('parsed_system_prompt, business_name')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const systemPrompt = profile?.parsed_system_prompt
    ?? `אתה עוזר שיווק לעסק בשם ${profile?.business_name ?? 'עסק ישראלי'}. כתוב תוכן בעברית.`

  // Generate ~3 ideas per category in parallel, then shuffle
  const batches = await Promise.allSettled(
    CATEGORIES.map(cat => generateIdeas(cat, systemPrompt).then(texts =>
      texts.slice(0, 4).map(text => ({ text, category: cat }))
    ))
  )

  const ideas: { text: string; category: string }[] = []
  for (const batch of batches) {
    if (batch.status === 'fulfilled') ideas.push(...batch.value)
  }

  // Shuffle
  for (let i = ideas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ideas[i], ideas[j]] = [ideas[j], ideas[i]]
  }

  return NextResponse.json({ ideas: ideas.slice(0, 12) })
}
