import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { ROLE_LABELS } from "@/features/admin/access"
import type { Role } from "@/lib/api/permissions"

/** Shown instead of a page the signed-in person's role doesn't cover. */
export function AccessDenied({ role, staff }: { role: Role; staff: boolean }) {
  return (
    <div role="alert" className="mx-auto grid max-w-md justify-items-center gap-4 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive"><ShieldAlert className="size-8" aria-hidden="true" /></span>
      <h1 className="text-2xl font-bold tracking-tight">{staff ? "You don't have access to this section" : "This area is for staff"}</h1>
      <p className="text-muted-foreground">
        {staff ? `Your role (${ROLE_LABELS[role]}) doesn't include this part of the admin. Ask the store owner if you need it.` : "Your account is a customer account. Sign in with a staff account to use the admin console."}
      </p>
      <Link href={staff ? "/admin" : "/"} className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25">{staff ? "Back to dashboard" : "Back to the store"}</Link>
    </div>
  )
}
