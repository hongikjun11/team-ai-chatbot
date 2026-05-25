import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { saveMasterBuffer } from '@/lib/blob'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as 'db' | 'mail' | null

  if (!file || !type || !['db', 'mail'].includes(type)) {
    return NextResponse.json({ error: '파일 또는 타입이 없습니다' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    return NextResponse.json({ error: 'Excel 파일(.xlsx)만 업로드 가능합니다' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await saveMasterBuffer(type, buffer)

  return NextResponse.json({ ok: true, url, name: file.name })
}
