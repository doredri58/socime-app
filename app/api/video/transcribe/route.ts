import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { deductTokens } from '@/lib/tokens'

export const runtime = 'nodejs'
export const maxDuration = 60

const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2'

/* ── helpers ── */

function wordsToSrt(words: Array<{ text: string; start: number; end: number }>): string {
  const lines: string[] = []
  const CHUNK_MS = 3000
  let i = 0
  let idx = 1

  while (i < words.length) {
    const chunkStart = words[i].start
    const chunkWords: string[] = []

    while (i < words.length && words[i].start - chunkStart < CHUNK_MS) {
      chunkWords.push(words[i].text)
      i++
    }

    const chunkEnd = words[i - 1].end
    const fmt = (ms: number) => {
      const totalSec = Math.floor(ms / 1000)
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      const msRem = ms % 1000
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(msRem).padStart(3, '0')}`
    }

    lines.push(`${idx}`)
    lines.push(`${fmt(chunkStart)} --> ${fmt(chunkEnd)}`)
    lines.push(chunkWords.join(' '))
    lines.push('')
    idx++
  }

  return lines.join('\n')
}

/* ── POST: submit transcription job ── */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { cloudinary_url?: string; language?: string }
  const { cloudinary_url, language = 'he' } = body

  if (!cloudinary_url) {
    return NextResponse.json({ error: 'cloudinary_url required' }, { status: 400 })
  }

  const res = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method: 'POST',
    headers: {
      authorization: process.env.ASSEMBLYAI_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: cloudinary_url,
      language_code: language,
      word_boost: [],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `AssemblyAI error: ${err}` }, { status: 502 })
  }

  const data = await res.json() as { id: string }

  // Deduct tokens for transcription
  await deductTokens(user.id, 'video_transcribe')

  return NextResponse.json({ job_id: data.id })
}

/* ── GET: poll transcription status ── */
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const job_id = req.nextUrl.searchParams.get('job_id')
  if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

  const res = await fetch(`${ASSEMBLYAI_BASE}/transcript/${job_id}`, {
    headers: { authorization: process.env.ASSEMBLYAI_API_KEY! },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to poll AssemblyAI' }, { status: 502 })
  }

  const data = await res.json() as {
    status: string
    text?: string
    words?: Array<{ text: string; start: number; end: number }>
    error?: string
  }

  if (data.status === 'completed' && data.words) {
    const srt = wordsToSrt(data.words)
    return NextResponse.json({ status: 'completed', srt, text: data.text })
  }

  if (data.status === 'error') {
    return NextResponse.json({ status: 'error', error: data.error })
  }

  return NextResponse.json({ status: data.status })
}
