import { Authorized, currentAdminRole } from "@/components/admin/authorized"
import { DashboardView } from "@/components/admin/dashboard-view"
import { can } from "@/lib/api/permissions"
import { EMPTY_REPORT, loadAdminDashboard, loadAdminReports, type DashPerms } from "@/lib/db/queries/admin-reports"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  const role = await currentAdminRole()
  const perms: DashPerms = { reports: can(role, "reports:read"), orders: can(role, "orders:read"), inventory: can(role, "inventory:read"), catalog: can(role, "catalog:write"), coupons: can(role, "coupons:write") }
  // Sales figures are only queried (and sent to the browser) for roles that may see them.
  const [report, extras] = await Promise.all([perms.reports ? loadAdminReports(180) : EMPTY_REPORT, loadAdminDashboard(perms)])
  return <DashboardView report={report} extras={extras} perms={perms} />
}

export default function AdminOverviewPage() {
  return <Authorized section="/admin"><Data /></Authorized>
}
