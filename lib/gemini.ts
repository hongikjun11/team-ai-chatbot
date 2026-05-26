export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// 모델 우선순위: 앞에서부터 순서대로 시도
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
]

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// 일시적 오류 여부 (재시도 / 다음 모델로 폴백할 오류 코드)
function isRetryable(status: number): boolean {
  return status === 429 || status === 503 || status === 500
}

async function callModel(
  model: string,
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const contents = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }))

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
  }

  const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const message = errData?.error?.message ?? `HTTP ${res.status}`
    const err = new Error(message) as Error & { status: number }
    err.status = res.status
    throw err
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('AI 응답이 비어있습니다')
  return text
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateReply(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다')

  let lastError: Error | null = null

  for (const model of MODELS) {
    // 각 모델당 최대 2회 시도
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[gemini] 시도: ${model} (attempt ${attempt})`)
        const text = await callModel(model, apiKey, systemPrompt, messages)
        console.log(`[gemini] 성공: ${model}`)
        return text
      } catch (err) {
        const e = err as Error & { status?: number }
        lastError = e
        console.warn(`[gemini] 실패: ${model} attempt ${attempt} — ${e.message}`)

        if (isRetryable(e.status ?? 0)) {
          if (attempt < 2) {
            // 같은 모델 재시도 전 1.5초 대기
            await sleep(1500)
            continue
          }
          // 2번 모두 실패 → 다음 모델로
          break
        } else {
          // 재시도 불필요한 오류(400, 404 등) → 다음 모델로 바로 이동
          break
        }
      }
    }
  }

  throw new Error(lastError?.message ?? 'AI 응답 오류가 발생했습니다')
}
