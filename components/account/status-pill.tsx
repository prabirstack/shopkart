import { StatusBadge } from "@/components/admin/status-badge"
import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/features/account/orders"

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <StatusBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusBadge>
}
