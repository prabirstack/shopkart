import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { AccessDenied } from "@/components/admin/access-denied"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { canViewRoute, ROLE_LABELS } from "@/features/admin/access"
import { AdminHydrator } from "@/features/admin/hooks"
import { safeNext } from "@/lib/safe-next"
import { auth } from "@/lib/auth"
import { isStaff, type Role } from "@/lib/api/permissions"

/**
 * Real access control for the admin console, run on the server for every request:
 *   1. no valid session -> sign in, then come back here;
 *   2. a customer account -> "this area is for staff";
 *   3. a staff role that doesn't cover this section -> "no access" (the sidebar already hides it).
 * The role is read from the database each time (no cookie cache), so removing someone's access is immediate.
 * Unauthorized people never get the page rendered inside the shell. The APIs enforce the same rules independently.
 */
export async function AdminGate({ children }: { children: ReactNode }) {
  const h = await headers()
  // Set by proxy.ts for every /admin request. If it is ever missing, require the strictest permission.
  const pathname = h.get("x-pathname") ?? "/admin/settings"
  const session = await auth.api.getSession({ headers: h })
  if (!session) redirect(`/login?next=${encodeURIComponent(safeNext(pathname, "/admin"))}`)

  const role = ((session.user as { role?: string }).role ?? "customer") as Role
  const user = { name: session.user.name, email: session.user.email, role, roleLabel: ROLE_LABELS[role] }
  const allowed = canViewRoute(role, pathname)

  return (
    <TooltipProvider>
      <AdminHydrator />
      <SidebarProvider>
        {isStaff(role) && <AdminSidebar role={role} />}
        <SidebarInset className="min-w-0 bg-background">
          {isStaff(role) && <AdminTopbar user={user} />}
          {isStaff(role) && <p role="note" className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900">Signed in as {user.name} ({user.roleLabel}). The records shown here are still sample data kept in this browser, so changes are not saved to the database yet.</p>}
          <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 p-4 md:p-6">{allowed ? children : <AccessDenied role={role} staff={isStaff(role)} />}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
