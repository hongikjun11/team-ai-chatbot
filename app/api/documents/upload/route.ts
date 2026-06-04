import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { uploadQnaDocument } from '@/lib/blob'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '파일 없음' }, { status: 400 })
    }

    const allowed = ['pdf', 'docx', 'doc', 'xlsx', 'xls']
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: '지원하지 않는 형식' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadQnaDocument(file.name, buffer)

    return NextResponse.json({ ok: true, url, name: file.name })
  } catch (err) {
    console.error('[documents/upload] 오류:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `업로드 실패: ${message}` }, { status: 500 })
  }
}
