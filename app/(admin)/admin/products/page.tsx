import { Authorized } from "@/components/admin/authorized"
import { Suspense } from "react"
import { ProductsView } from "@/components/admin/products-view"
import { Skeleton } from "@/components/ui/skeleton"
import { loadAdminProducts, loadAdminRefs } from "@/lib/db/queries"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  const [products, refs] = await Promise.all([loadAdminProducts(), loadAdminRefs()])
  return <ProductsView products={products} categories={refs.categories} />
}

export default function AdminProductsPage() {
  return <Authorized section="/admin/products"><Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}><Data /></Suspense></Authorized>
}
