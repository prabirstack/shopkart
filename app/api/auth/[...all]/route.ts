import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/lib/auth"

// Sign-up, sign-in, sign-out, session, password reset, email verification and Google callbacks
// are all served by Better Auth under /api/auth/*.
export const { GET, POST } = toNextJsHandler(auth)
