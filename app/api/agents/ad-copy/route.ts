import { NextRequest } from 'next/server'
import { runProAgent } from '@/lib/agentRoute'
import { runAdCopywriter } from '@/lib/agents'

export const runtime = 'nodejs'

// POST { niche, audience, offer }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return runProAgent('agent_ad_copy', async () => {
    const r = await runAdCopywriter({ niche: body.niche, audience: body.audience, offer: body.offer })
    return { data: r.data, costUsd: r.costUsd }
  })
}
