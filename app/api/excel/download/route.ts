import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMasterUrl } from '@/lib/blob'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as 'db' | 'mail'
  if (!type || !['db', 'mail'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const url = await getMasterUrl(type)
  if (!url) {
    return NextResponse.json({ error: '파일이 없습니다' }, { status: 404 })
  }

  return NextResponse.json({ url })
}
