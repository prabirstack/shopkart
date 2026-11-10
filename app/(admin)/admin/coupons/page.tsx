import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { SimpleTable } from "@/components/admin/simple-table"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { coupons } from "@/features/admin/demo"
import { formatMoney } from "@/lib/money"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

export default function AdminCouponsPage() {
  return (
    <>
      <PageHeader title="Coupons" description="Discount codes. Terms must match what checkout enforces.">
        <Button disabled title="Coupon editing arrives in the coupons chapter">New coupon</Button>
      </PageHeader>
      <DemoNotice />
      <SimpleTable rows={coupons} rowKey={(c) => c.code} caption="All coupons." empty="No coupons yet. Create one to run a promotion."
        columns={[
          { header: "Code", cell: (c) => <span className="font-mono text-xs font-semibold">{c.code}</span> },
          { header: "Discount", cell: (c) => c.kind === "percent" ? `${c.value}% off` : `${rupees(c.value)} off`, className: "whitespace-nowrap" },
          { header: "Min. order", align: "right", cell: (c) => rupees(c.minOrderPaise) },
          { header: "Used", align: "right", cell: (c) => `${c.used} / ${c.limit}` },
          { header: "Expires", cell: (c) => c.expires, className: "whitespace-nowrap" },
          { header: "Status", cell: (c) => c.active ? <StatusBadge tone="good">Active</StatusBadge> : <StatusBadge tone="muted">Inactive</StatusBadge> },
        ]} />
    </>
  )
}
