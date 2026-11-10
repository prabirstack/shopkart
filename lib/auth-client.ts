import { createAuthClient } from "better-auth/react"

// Talks to /api/auth/* on the same origin, so no baseURL is needed. Sessions live in an httpOnly cookie
// that this code never sees; it only gets the user back from the server.
export const authClient = createAuthClient()

export { safeNext } from "./safe-next"
