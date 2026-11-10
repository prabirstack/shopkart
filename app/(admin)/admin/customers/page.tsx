import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { SimpleTable } from "@/components/admin/simple-table"
import { StatusBadge } from "@/components/admin/status-badge"
import { customers } from "@/features/admin/demo"
import { formatMoney } from "@/lib/money"

export default function AdminCustomersPage() {
  return (
    <>
      <PageHeader title="Customers" description="People with an account. Checkout needs a verified account." />
      <DemoNotice />
      <SimpleTable rows={customers} rowKey={(c) => c.id} caption="Customers by most recent activity." empty="No customers yet."
        columns={[
          { header: "Name", cell: (c) => c.name, className: "font-medium" },
          { header: "Email", cell: (c) => c.email, className: "text-muted-foreground" },
          { header: "Joined", cell: (c) => c.joined, className: "whitespace-nowrap" },
          { header: "Orders", align: "right", cell: (c) => c.orders },
          { header: "Total spent", align: "right", cell: (c) => formatMoney(c.spentPaise, undefined, undefined, { hideZeroDecimals: true }) },
          { header: "Account", cell: (c) => <StatusBadge tone={c.verified ? "good" : "warn"}>{c.verified ? "Verified" : "Unverified"}</StatusBadge> },
        ]} />
    </>
  )
}
