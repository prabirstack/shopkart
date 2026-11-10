import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { SimpleTable } from "@/components/admin/simple-table"
import { StatusBadge } from "@/components/admin/status-badge"
import { returns, type ReturnStatus } from "@/features/admin/demo"
import { formatMoney } from "@/lib/money"

const tone: Record<ReturnStatus, "good" | "warn" | "info" | "muted" | "bad"> = {
  requested: "warn", approved: "info", received: "info", refunded: "good", rejected: "bad",
}

export default function AdminReturnsPage() {
  return (
    <>
      <PageHeader title="Returns" description="Return requests and refund progress. Partial refunds and GST credit notes come later." />
      <DemoNotice />
      <SimpleTable rows={returns} rowKey={(r) => r.id} caption="Return requests, newest first." empty="No return requests."
        columns={[
          { header: "Return", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { header: "Order", cell: (r) => <span className="font-mono text-xs">{r.order}</span> },
          { header: "Customer", cell: (r) => r.customer },
          { header: "Reason", cell: (r) => r.reason, className: "min-w-48" },
          { header: "Refund", align: "right", cell: (r) => formatMoney(r.refundPaise, undefined, undefined, { hideZeroDecimals: true }) },
          { header: "Status", cell: (r) => <StatusBadge tone={tone[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</StatusBadge> },
        ]} />
    </>
  )
}
