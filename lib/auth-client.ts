import { createAuthClient } from "better-auth/react"

// Talks to /api/auth/* on the same origin, so no baseURL is needed. Sessions live in an httpOnly cookie
// that this code never sees; it only gets the user back from the server.
export const authClient = createAuthClient()

/** Where to send someone after signing in. Only same-site paths are allowed, so a crafted ?next= can't redirect off-site. */
export function safeNext(raw: string | null | undefined, fallback = "/account") {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : fallback
}
