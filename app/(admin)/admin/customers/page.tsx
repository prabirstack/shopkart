import { Suspense } from "react"
import { Authorized } from "@/components/admin/authorized"
import { TodayProvider } from "@/features/admin/today"
import { istToday } from "@/features/admin/format"
import { CustomersView } from "@/components/admin/customers-view"
import { Skeleton } from "@/components/ui/skeleton"
import { loadAdminCustomers } from "@/lib/db/queries/admin-views"
import { loadAdminCustomerStats } from "@/lib/db/queries/admin-views-extra"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  const [customers, stats] = await Promise.all([loadAdminCustomers(), loadAdminCustomerStats()])
  return <TodayProvider today={istToday()}><CustomersView customers={customers} stats={stats} /></TodayProvider>
}

export default function Page() {
  return <Authorized section="/admin/customers"><Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}><Data /></Suspense></Authorized>
}
