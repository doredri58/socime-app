import { generatePost as generateWithOpenAI, moderateContent } from './openai'
import { generatePost as generateWithGemini } from './gemini'

const provider = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase()

export async function generatePost(businessDesc: string) {
  if (provider === 'gemini') return generateWithGemini(businessDesc)
  return generateWithOpenAI(businessDesc)
}

export { moderateContent }
