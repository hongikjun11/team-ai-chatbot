import { NextResponse } from 'next/server'
import { listQnaDocsWithMeta } from '@/lib/blob'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const docs = await listQnaDocsWithMeta()
    return NextResponse.json({ docs })
  } catch (err) {
    console.error('[documents/list] 오류:', err)
    return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 })
  }
}
