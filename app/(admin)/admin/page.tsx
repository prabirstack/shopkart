import { Suspense } from "react"
import { Authorized, requireAdminUser } from "@/components/admin/authorized"
import { DashboardSkeleton } from "@/components/admin/dashboard-skeleton"
import { DashboardView, type DeskInfo } from "@/components/admin/dashboard-view"
import { loadDashboardData } from "@/lib/db/queries/admin-reports"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

const part = (d: Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...opts }).format(d)

/** Greeting, weekday and date for the masthead, in India time. Runs per request (after the session was read). */
function deskInfo(name: string, now: Date): DeskInfo {
  const hour = Number(part(now, { hour: "numeric", hourCycle: "h23" }))
  return {
    greeting: hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening", name,
    weekday: part(now, { weekday: "long" }), day: part(now, { day: "numeric" }), monthYear: part(now, { month: "short", year: "numeric" }),
  }
}

async function Data() {
  const me = await requireAdminUser("/admin")
  if (!me) return null
  // Sales figures are only queried (and sent to the browser) for roles that may see them.
  const { report, extras, perms } = await loadDashboardData(me.role)
  return <DashboardView report={report} extras={extras} perms={perms} desk={deskInfo(me.name, new Date())} />
}

export default function AdminOverviewPage() {
  return <Suspense fallback={<DashboardSkeleton />}><Authorized section="/admin"><Data /></Authorized></Suspense>
}
