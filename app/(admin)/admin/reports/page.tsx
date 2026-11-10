import { Authorized } from "@/components/admin/authorized"
import { ReportsView } from "@/components/admin/reports-view"
import { loadAdminReports } from "@/lib/db/queries/admin-reports"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  return <ReportsView report={await loadAdminReports()} />
}

export default function Page() {
  return <Authorized section="/admin/reports"><Data /></Authorized>
}
