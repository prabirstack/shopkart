import { Authorized } from "@/components/admin/authorized"
import { OrderDetail } from "@/components/admin/order-detail"

// Order IDs are looked up at runtime, so nothing is prerendered here.
export const instant = false

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params
  return <Authorized section="/admin/orders"><OrderDetail id={id} /></Authorized>
}
