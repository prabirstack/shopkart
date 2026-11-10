import "server-only"

import { auth } from "@/lib/auth"
import type { Role } from "./permissions"

export type Session = { sessionId: string; userId: string; role: Role; name: string; email: string; emailVerified: boolean }

/** Resolves the Better Auth session from the request's cookies (or a bearer header). Null when signed out. */
export async function getSession(req: Request): Promise<Session | null> {
  const s = await auth.api.getSession({ headers: req.headers })
  if (!s) return null
  const role = ((s.user as { role?: string }).role ?? "customer") as Role
  return { sessionId: s.session.id, userId: s.user.id, role, name: s.user.name, email: s.user.email, emailVerified: s.user.emailVerified }
}
