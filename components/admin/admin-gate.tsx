import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import type { ReactNode } from "react"
import { AccessDenied } from "@/components/admin/access-denied"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ROLE_LABELS } from "@/features/admin/access"
import { loadAdminCounts } from "@/lib/db/queries"
import { auth } from "@/lib/auth"
import { can, isStaff, type Role } from "@/lib/api/permissions"

/**
 * Shell for the admin console. It runs on a full page load, so it only decides what the shell looks like:
 *   no session -> sign in; customer account -> "this area is for staff" instead of the console.
 * It does NOT authorize individual sections: layouts are not re-rendered on client-side navigation, so that
 * is done per page by <Authorized> (components/admin/authorized.tsx), and again by every API endpoint.
 */
export async function AdminGate({ children }: { children: ReactNode }) {
  // Opt into request time first: reading the session compares expiry dates (`new Date()`), which Next refuses to do while prerendering.
  await connection()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login?next=%2Fadmin")

  const role = ((session.user as { role?: string }).role ?? "customer") as Role
  const user = { name: session.user.name, email: session.user.email, role, roleLabel: ROLE_LABELS[role] }

  // Badge counts, computed only for the sections this role may open.
  const counts = isStaff(role) ? await loadAdminCounts({ orders: can(role, "orders:read"), stock: can(role, "inventory:read"), returns: can(role, "returns:manage"), reviews: can(role, "reviews:moderate"), inbox: can(role, "inbox:manage") }) : null

  return (
    <TooltipProvider>
      <SidebarProvider>
        {counts && <AdminSidebar role={role} counts={counts} />}
        <SidebarInset className="min-w-0 bg-background">
          {counts && <AdminTopbar user={user} counts={counts} />}
          {isStaff(role) && <p className="border-b bg-muted/40 px-4 py-1.5 text-center text-xs text-muted-foreground">Signed in as <span className="font-medium text-foreground">{user.name}</span> ({user.roleLabel}). Changes here are saved to the database.</p>}
          <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 p-4 md:p-6">{isStaff(role) ? children : <AccessDenied role={role} staff={false} />}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
