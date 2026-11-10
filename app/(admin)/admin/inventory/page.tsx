import { Authorized } from "@/components/admin/authorized"
import { InventoryView } from "@/components/admin/inventory-view"
import { loadAdminMovements, loadAdminProducts } from "@/lib/db/queries"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  const [products, movements] = await Promise.all([loadAdminProducts(), loadAdminMovements()])
  return <InventoryView products={products} movements={movements} />
}

export default function Page() {
  return <Authorized section="/admin/inventory"><Data /></Authorized>
}
