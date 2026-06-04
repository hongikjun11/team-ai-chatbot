import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { saveMasterBuffer } from '@/lib/blob'

// Vercel 기본 4.5MB 제한 → 10MB로 확장
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
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

    // Blob 토큰 확인 (디버그용)
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token || token === 'your_blob_token_here') {
      console.error('[upload] BLOB_READ_WRITE_TOKEN이 설정되지 않음')
      return NextResponse.json({ error: 'Blob 토큰이 설정되지 않았습니다. Vercel 환경변수를 확인하세요.' }, { status: 500 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    console.log(`[upload] type=${type} size=${buffer.length} bytes`)

    const url = await saveMasterBuffer(type, buffer)
    console.log(`[upload] 저장 완료: ${url}`)

    return NextResponse.json({ ok: true, url, name: file.name })
  } catch (err) {
    console.error('[upload] 오류:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `업로드 실패: ${message}` }, { status: 500 })
  }
}
