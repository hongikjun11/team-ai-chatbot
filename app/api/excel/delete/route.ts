import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { deleteMaster } from '@/lib/blob'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const { type } = await request.json() as { type: 'db' | 'mail' }

    if (type !== 'db' && type !== 'mail') {
      return NextResponse.json({ error: 'type 파라미터 필요 (db|mail)' }, { status: 400 })
    }

    const deleted = await deleteMaster(type)
    if (!deleted) {
      return NextResponse.json({ error: '삭제할 파일이 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[excel/delete] 오류:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `삭제 실패: ${message}` }, { status: 500 })
  }
}
