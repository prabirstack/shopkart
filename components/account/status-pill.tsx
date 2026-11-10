import { StatusBadge } from "@/components/admin/status-badge"
import type { OrderStatus } from "@/features/account/demo"

const map: Record<OrderStatus, { label: string; tone: "info" | "warn" | "good" | "muted" }> = {
  processing: { label: "Processing", tone: "warn" },
  shipped: { label: "Shipped", tone: "info" },
  delivered: { label: "Delivered", tone: "good" },
  refunded: { label: "Refunded", tone: "muted" },
}

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <StatusBadge tone={map[status].tone}>{map[status].label}</StatusBadge>
}
