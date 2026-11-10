import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { AccessDenied } from "@/components/admin/access-denied"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ROLE_LABELS } from "@/features/admin/access"
import { AdminHydrator } from "@/features/admin/hooks"
import { auth } from "@/lib/auth"
import { isStaff, type Role } from "@/lib/api/permissions"

/**
 * Shell for the admin console. It runs on a full page load, so it only decides what the shell looks like:
 *   no session -> sign in; customer account -> "this area is for staff" instead of the console.
 * It does NOT authorize individual sections: layouts are not re-rendered on client-side navigation, so that
 * is done per page by <Authorized> (components/admin/authorized.tsx), and again by every API endpoint.
 */
export async function AdminGate({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login?next=%2Fadmin")

  const role = ((session.user as { role?: string }).role ?? "customer") as Role
  const user = { name: session.user.name, email: session.user.email, role, roleLabel: ROLE_LABELS[role] }

  return (
    <TooltipProvider>
      <AdminHydrator />
      <SidebarProvider>
        {isStaff(role) && <AdminSidebar role={role} />}
        <SidebarInset className="min-w-0 bg-background">
          {isStaff(role) && <AdminTopbar user={user} />}
          {isStaff(role) && <p role="note" className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900">Signed in as {user.name} ({user.roleLabel}). The records shown here are still sample data kept in this browser, so changes are not saved to the database yet.</p>}
          <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 p-4 md:p-6">{isStaff(role) ? children : <AccessDenied role={role} staff={false} />}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
