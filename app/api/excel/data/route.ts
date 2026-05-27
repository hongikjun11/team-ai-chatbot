import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMasterBuffer } from '@/lib/blob'
import { loadWorkbookFromBuffer } from '@/lib/excel'

// 실제 헤더 행 판별용 키워드 (2개 이상 일치하면 헤더 행으로 인식)
const HEADER_KEYWORDS = ['신청일자', '신청자', '반입', '반출', '파일명', '부서', '용도', '보안']

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    if ('text' in (v as object)) return String((v as { text: string }).text)
    if ('result' in (v as object)) return String((v as { result: unknown }).result)
  }
  return String(v)
}

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

    // 전체 행 읽기
    const allRows: string[][] = []
    ws.eachRow((row) => {
      const cells = (row.values as unknown[])
        .slice(1)
        .map(cellToString)
      allRows.push(cells)
    })

    // 실제 헤더 행 찾기 (제목행/병합행 건너뜀)
    let headerRowIdx = 0
    for (let i = 0; i < allRows.length; i++) {
      const matched = HEADER_KEYWORDS.filter((kw) =>
        allRows[i].some((cell) => cell.includes(kw))
      )
      if (matched.length >= 2) {
        headerRowIdx = i
        break
      }
    }

    const headers = allRows[headerRowIdx] ?? []
    const rows = allRows
      .slice(headerRowIdx + 1)
      .filter((r) => r.some((c) => c.trim() !== ''))

    return NextResponse.json({ headers, rows })
  } catch (err) {
    console.error('[excel/data]', err)
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 })
  }
}
