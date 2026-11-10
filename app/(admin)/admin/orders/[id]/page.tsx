import { OrderDetail } from "@/components/admin/order-detail"

// Order IDs are looked up in the store at runtime, so nothing is prerendered here.
export const instant = false

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params
  return <OrderDetail id={id} />
}
