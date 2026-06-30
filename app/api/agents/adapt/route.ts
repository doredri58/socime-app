import { NextRequest } from 'next/server'
import { runProAgent } from '@/lib/agentRoute'
import { runMultiPlatformAdapter } from '@/lib/agents'

export const runtime = 'nodejs'

// POST { content }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return runProAgent('agent_adapt', async () => {
    const r = await runMultiPlatformAdapter(body.content)
    return { data: r.data, costUsd: r.costUsd }
  })
}
