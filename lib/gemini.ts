import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function generateReply(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const model = getGeminiModel()

  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }))

  const lastMessage = messages[messages.length - 1].content

  const chat = model.startChat({
    systemInstruction: systemPrompt,
    history,
  })

  const result = await chat.sendMessage(lastMessage)
  return result.response.text()
}
