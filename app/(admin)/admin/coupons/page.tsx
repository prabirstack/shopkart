import { Authorized } from "@/components/admin/authorized"
import { TodayProvider } from "@/features/admin/today"
import { istToday } from "@/features/admin/format"
import { CouponsView } from "@/components/admin/coupons-view"
import { Skeleton } from "@/components/ui/skeleton"
import { loadAdminCoupons } from "@/lib/db/queries/admin-views"
import { Suspense } from "react"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  return <TodayProvider today={istToday()}><CouponsView coupons={await loadAdminCoupons()} /></TodayProvider>
}

export default function Page() {
  return <Authorized section="/admin/coupons"><Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}><Data /></Suspense></Authorized>
}
