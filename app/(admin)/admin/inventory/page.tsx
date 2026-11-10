import { Authorized } from "@/components/admin/authorized"
import { InventoryView } from "@/components/admin/inventory-view"

export default function Page() {
  return <Authorized section="/admin/inventory"><InventoryView /></Authorized>
}
