import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import type { ReactNode } from "react"
import { AccessDenied } from "@/components/admin/access-denied"
import { canViewRoute } from "@/features/admin/access"
import { auth } from "@/lib/auth"
import { isStaff, type Role } from "@/lib/api/permissions"

/**
 * Per-page authorization. Wrap the content of EVERY admin page in this, naming the section it belongs to.
 *
 * Why here and not in the layout: layouts are not re-rendered on client-side navigation, so a check in the
 * layout runs on a full page load but is skipped when someone clicks (or router.push-es) from one admin page
 * to another. A page is rendered fresh on every navigation, so this check can't be skipped.
 *
 * Put data loading INSIDE the children (an async component), never next to this wrapper: children only run
 * when this component renders them, so people without access never trigger the query.
 * The role is read from the database each time (no cookie cache) and the API endpoints enforce it again.
 */
export async function Authorized({ section, children }: { section: string; children: ReactNode }) {
  await connection() // request time: reading the session compares expiry dates (`new Date()`)
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/login?next=${encodeURIComponent(section)}`)
  const role = ((session.user as { role?: string }).role ?? "customer") as Role
  if (!canViewRoute(role, section)) return <AccessDenied role={role} staff={isStaff(role)} />
  return <>{children}</>
}

/** For pages that need the signed-in user (for example to label who did something). Same checks as Authorized. */
export async function requireAdminUser(section: string) {
  await connection() // request time: reading the session compares expiry dates (`new Date()`)
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/login?next=${encodeURIComponent(section)}`)
  const role = ((session.user as { role?: string }).role ?? "customer") as Role
  if (!canViewRoute(role, section)) return null
  return { userId: session.user.id, name: session.user.name, role }
}

/** The signed-in person's role. Call it from inside <Authorized> to tailor a screen (for example hide actions the role lacks). */
export async function currentAdminRole(): Promise<Role> {
  await connection() // request time: reading the session compares expiry dates (`new Date()`)
  const session = await auth.api.getSession({ headers: await headers() })
  return ((session?.user as { role?: string } | undefined)?.role ?? "customer") as Role
}
