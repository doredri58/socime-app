import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

// זמנים אופטימליים לפי פלטפורמה ויום — שוק ישראלי
const SLOTS: Record<string, number[]> = {
  sunday:    [7, 12, 19, 21],
  monday:    [7, 12, 19, 21],
  tuesday:   [7, 12, 19, 21],
  wednesday: [8, 13, 19, 21],
  thursday:  [8, 13, 18, 20],
  friday:    [8, 11],           // אין אחה"צ — לפני שבת
  saturday:  [],                // שבת — אין פרסום
}

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

function nextSlots(count = 5): { datetime: string; label: string; score: number }[] {
  const now = new Date()
  const results = []

  for (let dayOffset = 0; dayOffset <= 7 && results.length < count; dayOffset++) {
    const d = new Date(now)
    d.setDate(d.getDate() + dayOffset)
    const dayName = DAYS[d.getDay()]
    const hours = SLOTS[dayName] ?? []

    for (const h of hours) {
      if (results.length >= count) break
      const dt = new Date(d)
      dt.setHours(h, 0, 0, 0)
      if (dt <= now) continue   // לא בעבר

      const dayLabel = dayOffset === 0 ? 'היום' : dayOffset === 1 ? 'מחר'
        : d.toLocaleDateString('he-IL', { weekday: 'long' })

      results.push({
        datetime: dt.toISOString(),
        label: `${dayLabel} ${String(h).padStart(2,'0')}:00`,
        score: h >= 19 ? 95 : h >= 12 ? 85 : 80,
      })
    }
  }
  return results
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const db = createServiceClient()

  // שלוף Blackout periods פעילים
  const now = new Date()
  const { data: blackouts } = await db
    .from('blackout_periods')
    .select('start_datetime, end_datetime')
    .eq('user_id', user.id)
    .gte('end_datetime', now.toISOString())

  const slots = nextSlots(8).filter(slot => {
    const t = new Date(slot.datetime)
    return !(blackouts ?? []).some(b =>
      t >= new Date(b.start_datetime) && t <= new Date(b.end_datetime)
    )
  })

  return NextResponse.json({ slots })
}
