import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Fast, optimistic gate: no session cookie means no account or admin pages, so send people to sign in and
 * bring them back afterwards. This only checks that a cookie exists. Real authorization happens on the
 * server: every admin page checks the session AND the role against the database (components/admin/authorized.tsx),
 * and the API validates the session on every call.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request, { cookiePrefix: "sk" })) {
    const url = new URL("/login", request.url)
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ["/account/:path*", "/admin/:path*", "/admin"] }
