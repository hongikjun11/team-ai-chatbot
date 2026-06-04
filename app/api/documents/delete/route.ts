import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { deleteQnaDocument } from '@/lib/blob'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const { name } = await request.json() as { name: string }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name 파라미터 필요' }, { status: 400 })
    }

    const deleted = await deleteQnaDocument(name)
    if (!deleted) {
      return NextResponse.json({ error: '삭제할 파일이 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[documents/delete] 오류:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `삭제 실패: ${message}` }, { status: 500 })
  }
}
