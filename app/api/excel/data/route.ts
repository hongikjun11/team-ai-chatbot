import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMasterBuffer } from '@/lib/blob'
import { loadWorkbookFromBuffer } from '@/lib/excel'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as 'db' | 'mail' | null
  if (type !== 'db' && type !== 'mail') {
    return NextResponse.json({ error: 'type 파라미터 필요 (db|mail)' }, { status: 400 })
  }

  try {
    const buffer = await getMasterBuffer(type)
    if (!buffer) {
      return NextResponse.json({ headers: [], rows: [] })
    }

    const wb = await loadWorkbookFromBuffer(buffer)
    const ws = wb.worksheets[0]
    if (!ws) return NextResponse.json({ headers: [], rows: [] })

    const allRows: string[][] = []
    ws.eachRow((row) => {
      const cells = (row.values as (unknown)[])
        .slice(1) // index 0은 undefined
        .map((v) => {
          if (v === null || v === undefined) return ''
          if (typeof v === 'object' && 'text' in (v as object)) return String((v as { text: string }).text)
          if (typeof v === 'object' && 'result' in (v as object)) return String((v as { result: unknown }).result)
          return String(v)
        })
      allRows.push(cells)
    })

    const headers = allRows[0] ?? []
    const rows = allRows.slice(1).filter((r) => r.some((c) => c.trim() !== ''))

    return NextResponse.json({ headers, rows })
  } catch (err) {
    console.error('[excel/data]', err)
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 })
  }
}
