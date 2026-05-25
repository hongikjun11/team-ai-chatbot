import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMasterBuffer, saveMasterBuffer } from '@/lib/blob'
import {
  loadWorkbookFromBuffer,
  createEmptyDbWorkbook,
  createEmptyMailWorkbook,
  appendRowToSheet,
  serializeWorkbook,
  verifyLastRow,
} from '@/lib/excel'

export async function POST(request: NextRequest) {
  const { type, data } = await request.json() as {
    type: 'db' | 'mail'
    data: string[]
  }

  if (!type || !data || !Array.isArray(data)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const existingBuffer = await getMasterBuffer(type)
  const wb = existingBuffer
    ? await loadWorkbookFromBuffer(existingBuffer)
    : type === 'db'
    ? createEmptyDbWorkbook()
    : createEmptyMailWorkbook()

  const ws = wb.getWorksheet(1)!
  const colCount = 8
  const targetRow = appendRowToSheet(ws, data, colCount)

  const newBuffer = await serializeWorkbook(wb)
  const url = await saveMasterBuffer(type, newBuffer)

  // 저장 후 재오픈 검증
  const verifyWb = await loadWorkbookFromBuffer(newBuffer)
  const verifyWs = verifyWb.getWorksheet(1)!
  const verified = verifyLastRow(verifyWs, targetRow, colCount)

  if (!verified) {
    return NextResponse.json({ error: '저장 검증 실패' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, row: targetRow, url })
}
