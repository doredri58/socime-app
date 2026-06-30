import { NextRequest } from 'next/server'
import { runProAgent } from '@/lib/agentRoute'
import { runCompetitorAnalyst } from '@/lib/agents'

export const runtime = 'nodejs'

// POST { competitors: CompetitorPost[] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return runProAgent('agent_competitor', async () => {
    const r = await runCompetitorAnalyst(body.competitors)
    return { data: r.data, costUsd: r.costUsd }
  })
}
