import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { password, role } = await request.json()

  const adminPw = process.env.ADMIN_PASSWORD
  const guestPw = process.env.GUEST_PASSWORD

  let authenticated = false
  if (role === 'admin' && password === adminPw) authenticated = true
  else if (role === 'guest' && password === guestPw) authenticated = true

  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, role })
  response.cookies.set('site-auth', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8시간
  })
  return response
}
