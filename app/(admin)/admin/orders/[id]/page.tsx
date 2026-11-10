import { Authorized, currentAdminRole } from "@/components/admin/authorized"
import { OrderDetail } from "@/components/admin/order-detail"
import { can } from "@/lib/api/permissions"
import { loadAdminOrder } from "@/lib/db/queries"

// Orders are created at runtime, so the page looks the order up instead of prerendering.
export const instant = false

async function Data({ number }: { number: string }) {
  const [order, role] = await Promise.all([loadAdminOrder(decodeURIComponent(number)), currentAdminRole()])
  return <OrderDetail order={order} perms={{ fulfil: can(role, "orders:fulfil"), cancel: can(role, "orders:cancel"), refund: can(role, "returns:manage") }} />
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params
  return <Authorized section="/admin/orders"><Data number={id} /></Authorized>
}
