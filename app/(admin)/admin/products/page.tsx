import { Authorized } from "@/components/admin/authorized"
import { Suspense } from "react"
import { ProductsView } from "@/components/admin/products-view"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminProductsPage() {
  return <Authorized section="/admin/products"><Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}><ProductsView /></Suspense></Authorized>
}
