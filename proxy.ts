import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Fast, optimistic gate: no session cookie means no account or admin pages, so send people to sign in and
 * bring them back afterwards. This only checks that a cookie exists. Real authorization happens on the
 * server (the admin layout checks the session AND the role against the database on every request, and the
 * API validates the session on every call).
 *
 * It also hands the server the path being requested, as a request header it always overwrites, so the admin
 * layout can check the right permission for the section being opened.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request, { cookiePrefix: "sk" })) {
    const url = new URL("/login", request.url)
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }
  const headers = new Headers(request.headers)
  headers.set("x-pathname", request.nextUrl.pathname) // set, never forwarded from the client
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: ["/account/:path*", "/admin/:path*", "/admin"] }
