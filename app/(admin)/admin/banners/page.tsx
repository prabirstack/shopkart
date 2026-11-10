import { Authorized } from "@/components/admin/authorized"
import { TodayProvider } from "@/features/admin/today"
import { istToday } from "@/features/admin/format"
import { BannersView } from "@/components/admin/banners-view"
import { Skeleton } from "@/components/ui/skeleton"
import { loadAdminBanners } from "@/lib/db/queries/admin-views"
import { Suspense } from "react"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  return <TodayProvider today={istToday()}><BannersView banners={await loadAdminBanners()} /></TodayProvider>
}

export default function Page() {
  return <Authorized section="/admin/banners"><Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}><Data /></Suspense></Authorized>
}
