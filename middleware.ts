import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // API 라우트는 미들웨어 제외
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const password = request.cookies.get('site-password')?.value
  const sitePassword = process.env.SITE_PASSWORD

  if (password === sitePassword) {
    return NextResponse.next()
  }

  // 비밀번호 없으면 홈으로 (page.tsx에서 PasswordGate 렌더링)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
