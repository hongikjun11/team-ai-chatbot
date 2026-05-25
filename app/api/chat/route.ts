import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateReply, type ChatMessage } from '@/lib/gemini'
import { DB_MANAGEMENT_PROMPT } from '@/lib/prompts/db-management'
import { MAIL_EXPORT_PROMPT } from '@/lib/prompts/mail-export'
import { buildQnaPrompt } from '@/lib/prompts/qna'
import { listQnaDocs, getMasterBuffer, saveMasterBuffer } from '@/lib/blob'
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
  const { type, messages } = await request.json() as {
    type: 'db' | 'mail' | 'qna'
    messages: ChatMessage[]
  }

  let systemPrompt: string
  if (type === 'db') {
    systemPrompt = DB_MANAGEMENT_PROMPT
  } else if (type === 'mail') {
    systemPrompt = MAIL_EXPORT_PROMPT
  } else {
    const docUrls = await listQnaDocs()
    const contents = await Promise.all(docUrls.map(extractTextFromUrl))
    systemPrompt = buildQnaPrompt(contents)
  }

  const reply = await generateReply(systemPrompt, messages)

  // DB/Mail: AI 응답에서 save action JSON 파싱 후 엑셀 저장
  if (type === 'db' || type === 'mail') {
    const actionMatch = reply.match(/```json\s*(\{.*?\})\s*```/s)
    if (actionMatch) {
      try {
        const action = JSON.parse(actionMatch[1])
        if (
          (type === 'db' && action.action === 'save_db') ||
          (type === 'mail' && action.action === 'save_mail')
        ) {
          await saveExcelRow(type, action.data)
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }
  }

  return NextResponse.json({ reply })
}

async function saveExcelRow(type: 'db' | 'mail', data: string[]) {
  const existingBuffer = await getMasterBuffer(type)
  const wb = existingBuffer
    ? await loadWorkbookFromBuffer(existingBuffer)
    : type === 'db'
    ? createEmptyDbWorkbook()
    : createEmptyMailWorkbook()

  const ws = wb.getWorksheet(1)!
  const targetRow = appendRowToSheet(ws, data, 8)
  const newBuffer = await serializeWorkbook(wb)
  await saveMasterBuffer(type, newBuffer)

  // 검증
  const verifyWb = await loadWorkbookFromBuffer(newBuffer)
  const verifyWs = verifyWb.getWorksheet(1)!
  verifyLastRow(verifyWs, targetRow, 8)
}
