import { Authorized, currentAdminRole } from "@/components/admin/authorized"
import { Suspense } from "react"
import { OrdersView } from "@/components/admin/orders-view"
import { Skeleton } from "@/components/ui/skeleton"
import { can } from "@/lib/api/permissions"
import { loadAdminOrders } from "@/lib/db/queries"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  const [orders, role] = await Promise.all([loadAdminOrders(), currentAdminRole()])
  return <OrdersView orders={orders} canFulfil={can(role, "orders:fulfil")} />
}

export default function AdminOrdersPage() {
  return <Authorized section="/admin/orders"><Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}><Data /></Suspense></Authorized>
}
