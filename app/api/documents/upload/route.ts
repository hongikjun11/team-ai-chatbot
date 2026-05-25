import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { uploadQnaDocument } from '@/lib/blob'

export async function POST(request: NextRequest) {
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
}
