import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password === process.env.SITE_PASSWORD) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('site-password', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8시간
    })
    return response
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
