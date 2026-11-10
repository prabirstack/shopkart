import { Suspense } from "react"
import { ProductsView } from "@/components/admin/products-view"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminProductsPage() {
  return <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}><ProductsView /></Suspense>
}
