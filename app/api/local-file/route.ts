import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs'

const ALLOWED_SUBDIRS = ['qna-docs'] // 허용된 하위 폴더만 접근 가능

/** 로컬 모드에서 local-data/ 폴더의 파일을 서빙 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')
  const subdir = request.nextUrl.searchParams.get('subdir') // 선택적 하위 폴더

  if (!name) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 })
  }

  // 경로 순회 공격 방지: 파일명만 허용
  const safeName = path.basename(name)

  let filePath: string
  if (subdir) {
    if (!ALLOWED_SUBDIRS.includes(subdir)) {
      return NextResponse.json({ error: 'Invalid subdir' }, { status: 400 })
    }
    filePath = path.join(process.cwd(), 'local-data', subdir, safeName)
  } else {
    filePath = path.join(process.cwd(), 'local-data', safeName)
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: '파일이 없습니다' }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  const ext = safeName.split('.').pop()?.toLowerCase() ?? ''

  const contentTypeMap: Record<string, string> = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    txt: 'text/plain',
  }
  const contentType = contentTypeMap[ext] ?? 'application/octet-stream'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    },
  })
}
