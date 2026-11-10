import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/features/admin/demo"

const map: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Payment pending", className: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", className: "bg-blue-100 text-blue-800" },
  shipped: { label: "Shipped", className: "bg-violet-100 text-violet-800" },
  delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-800" },
  refunded: { label: "Refunded", className: "bg-neutral-200 text-neutral-700" },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = map[status]
  return <Badge variant="secondary" className={className}>{label}</Badge>
}
