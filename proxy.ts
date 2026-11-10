import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Fast, optimistic gate: no session cookie means no account pages, so send people to sign in and bring
 * them back afterwards. This only checks that a cookie exists. Real authorization happens where the data
 * is read (the API validates the session against the database on every request).
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request, { cookiePrefix: "sk" })) {
    const url = new URL("/login", request.url)
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ["/account/:path*"] }
