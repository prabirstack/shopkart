import { Suspense } from "react"
import { OrdersView } from "@/components/admin/orders-view"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminOrdersPage() {
  return <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}><OrdersView /></Suspense>
}
