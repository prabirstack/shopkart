import { StatusBadge } from "./status-badge"
import type { OrderStatus } from "@/features/admin/types"

export const orderStatusMeta: Record<OrderStatus, { label: string; tone: "good" | "warn" | "info" | "muted" | "bad" }> = {
  pending: { label: "Payment pending", tone: "warn" },
  paid: { label: "Paid", tone: "info" },
  packed: { label: "Packed", tone: "info" },
  shipped: { label: "Shipped", tone: "info" },
  delivered: { label: "Delivered", tone: "good" },
  cancelled: { label: "Cancelled", tone: "bad" },
  refunded: { label: "Refunded", tone: "muted" },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = orderStatusMeta[status]
  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
