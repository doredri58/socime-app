import { generatePost as generateWithGemini } from './gemini'

export async function generatePost(businessDesc: string, extraContext = '') {
  return generateWithGemini(businessDesc, extraContext)
}
