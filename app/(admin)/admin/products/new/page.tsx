import { Authorized } from "@/components/admin/authorized"
import { ProductForm } from "@/components/admin/product-form"
import { loadAdminRefs } from "@/lib/db/queries"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  return <ProductForm refs={await loadAdminRefs()} />
}

export default function NewProductPage() {
  return <Authorized section="/admin/products"><Data /></Authorized>
}
