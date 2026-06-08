import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    if (!token && req.nextUrl.pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  },
  { callbacks: { authorized: ({ token }) => !!token } }
)

export const config = { matcher: ['/dashboard/:path*'] }