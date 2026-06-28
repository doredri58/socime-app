import { generatePost as generateWithGemini } from './gemini'

export async function generatePost(businessDesc: string) {
  return generateWithGemini(businessDesc)
}
