import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMasterBuffer } from '@/lib/blob'
import { loadWorkbookFromBuffer, findLastDataRow } from '@/lib/excel'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as 'db' | 'mail'
  if (!type || !['db', 'mail'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const buffer = await getMasterBuffer(type)
  if (!buffer) {
    return NextResponse.json({ exists: false, rows: [] })
  }

  const wb = await loadWorkbookFromBuffer(buffer)
  const ws = wb.getWorksheet(1)!
  const colCount = 8
  const lastRow = findLastDataRow(ws, colCount)

  const rows: string[][] = []
  for (let r = 2; r <= lastRow; r++) {
    const row = Array.from({ length: colCount }, (_, i) =>
      String(ws.getCell(r, i + 1).value ?? '')
    )
    rows.push(row)
  }

  return NextResponse.json({ exists: true, rows })
}
