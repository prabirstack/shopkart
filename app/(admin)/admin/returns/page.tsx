import { Authorized } from "@/components/admin/authorized"
import { ReturnsView } from "@/components/admin/returns-view"
import { Skeleton } from "@/components/ui/skeleton"
import { loadAdminReturns } from "@/lib/db/queries/admin-views"
import { Suspense } from "react"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  return <ReturnsView returns={await loadAdminReturns()} />
}

export default function Page() {
  return <Authorized section="/admin/returns"><Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}><Data /></Suspense></Authorized>
}
