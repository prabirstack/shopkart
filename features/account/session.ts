import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { auth } from "@/lib/auth"

export type AccountUser = { id: string; name: string; email: string; phone: string | null; createdAt: Date }

const read = cache(async (): Promise<AccountUser | null> => {
  // Personal data: never render this ahead of the request (not even for prefetching). Session validation also
  // compares expiry with the current time, which Next does not allow while prerendering.
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  const u = session.user as typeof session.user & { phone?: string | null }
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? null, createdAt: new Date(u.createdAt) }
})

/**
 * The signed-in customer, or a redirect to sign-in that returns to `next`. Call it from inside an async
 * component under <Suspense> (it reads cookies). The proxy only checks that a cookie exists; this is the real check.
 */
export async function requireUser(next: string): Promise<AccountUser> {
  const user = await read()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}
