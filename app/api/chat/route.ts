import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateReply, type ChatMessage } from '@/lib/gemini'
import { DB_MANAGEMENT_PROMPT } from '@/lib/prompts/db-management'
import { MAIL_EXPORT_PROMPT } from '@/lib/prompts/mail-export'
import { buildQnaPrompt } from '@/lib/prompts/qna'
import { listQnaDocsWithMeta, getMasterBuffer, saveMasterBuffer } from '@/lib/blob'
import { extractTextFromUrl } from '@/lib/documents'
import {
  loadWorkbookFromBuffer,
  createEmptyDbWorkbook,
  createEmptyMailWorkbook,
  appendRowToSheet,
  serializeWorkbook,
  verifyLastRow,
} from '@/lib/excel'

export async function POST(request: NextRequest) {
  try {
    const { type, messages, customInstructions } = await request.json() as {
      type: 'db' | 'mail' | 'qna'
      messages: ChatMessage[]
      customInstructions?: string
    }

    let systemPrompt: string
    if (type === 'db') {
      systemPrompt = DB_MANAGEMENT_PROMPT
    } else if (type === 'mail') {
      systemPrompt = MAIL_EXPORT_PROMPT
    } else {
      // QnA: 문서 메타데이터(이름 + 다운로드 URL + 내용) 포함
      let docs: import('@/lib/prompts/qna').QnaDocInput[] = []
      try {
        const metas = await listQnaDocsWithMeta()
        docs = await Promise.all(
          metas.map(async (meta) => ({
            name: meta.name,
            downloadUrl: meta.downloadUrl,
            content: await extractTextFromUrl(meta.readUrl).catch(() => '(내용 추출 실패)'),
          }))
        )
      } catch (err) {
        console.warn('[chat/qna] 문서 로드 실패:', err)
      }
      systemPrompt = buildQnaPrompt(docs)
    }

    // 사용자 지침이 있으면 시스템 프롬프트 앞에 추가
    if (customInstructions && customInstructions.trim()) {
      systemPrompt = `# 추가 지침\n${customInstructions.trim()}\n\n---\n\n${systemPrompt}`
    }

    const reply = await generateReply(systemPrompt, messages)

    // DB/Mail: AI 응답에서 save action JSON 파싱 후 엑셀 저장
    if (type === 'db' || type === 'mail') {
      // AI가 여러 형식으로 JSON을 출력할 수 있어 두 가지 패턴으로 시도
      const patterns = [
        /```json\s*([\s\S]*?)\s*```/,   // ```json ... ```
        /```\s*([\s\S]*?)\s*```/,        // ``` ... ``` (언어 태그 없이)
      ]
      let rawJson: string | null = null
      for (const pattern of patterns) {
        const m = reply.match(pattern)
        if (m) { rawJson = m[1].trim(); break }
      }

      console.log(`[chat/${type}] reply snippet:`, reply.slice(-300))
      console.log(`[chat/${type}] rawJson found:`, rawJson)

      if (rawJson) {
        try {
          const action = JSON.parse(rawJson)
          if (
            (type === 'db' && action.action === 'save_db') ||
            (type === 'mail' && action.action === 'save_mail')
          ) {
            console.log(`[chat/${type}] saving row:`, action.data)
            await saveExcelRow(type, action.data)
            console.log(`[chat/${type}] save SUCCESS`)
          } else {
            console.log(`[chat/${type}] action not matched:`, action.action)
          }
        } catch (e) {
          console.error(`[chat/${type}] JSON parse/save error:`, e, '| raw:', rawJson)
        }
      } else {
        console.log(`[chat/${type}] no JSON block found in reply`)
      }
    }

    return NextResponse.json({ reply })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[chat] API error:', err)
    return NextResponse.json(
      { error: `AI 응답 오류: ${message}` },
      { status: 500 }
    )
  }
}

async function saveExcelRow(type: 'db' | 'mail', data: string[]) {
  const existingBuffer = await getMasterBuffer(type)
  const wb = existingBuffer
    ? await loadWorkbookFromBuffer(existingBuffer)
    : type === 'db'
    ? createEmptyDbWorkbook()
    : createEmptyMailWorkbook()

  // getWorksheet(1) 은 시트 ID 기준 → 업로드 파일에서 undefined 반환 가능
  // worksheets[0] 으로 첫 번째 시트를 안전하게 가져옴
  const ws = wb.worksheets[0]
  if (!ws) throw new Error('엑셀 파일에 시트가 없습니다')

  const targetRow = appendRowToSheet(ws, data, 8)
  const newBuffer = await serializeWorkbook(wb)
  await saveMasterBuffer(type, newBuffer)

  // 저장 검증
  const verifyWb = await loadWorkbookFromBuffer(newBuffer)
  const verifyWs = verifyWb.worksheets[0]
  if (verifyWs) verifyLastRow(verifyWs, targetRow, 8)
}
