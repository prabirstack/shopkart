import { StatusBadge } from "@/components/admin/status-badge"
import { RETURN_LABEL, RETURN_TONE, type ReturnStatus } from "@/features/account/returns"

export function ReturnStatusPill({ status }: { status: ReturnStatus }) {
  return <StatusBadge tone={RETURN_TONE[status]}>{RETURN_LABEL[status]}</StatusBadge>
}
