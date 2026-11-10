import Link from "next/link"
import { CreditCard, Download, FileText, Info, RotateCcw } from "lucide-react"
import { AccountTitle } from "@/components/account/account-title"
import { StatTile } from "@/components/account/stat-tile"
import { StatusBadge } from "@/components/admin/status-badge"
import { SimpleTable } from "@/components/admin/simple-table"
import { buttonVariants } from "@/components/ui/button"
import { orders } from "@/features/account/demo"
import { formatMoney } from "@/lib/money"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

export default function BillingHistoryPage() {
  const paid = orders.filter((o) => o.status !== "refunded").reduce((s, o) => s + o.totals.totalPaise, 0)
  const refunded = orders.filter((o) => o.status === "refunded").reduce((s, o) => s + o.totals.totalPaise, 0)
  return (
    <>
      <AccountTitle title="Billing history" description="Payments, refunds and GST tax invoices." />
      <ul className="grid gap-3 sm:grid-cols-3">
        <li><StatTile label="Total paid" value={rupees(paid)} icon={CreditCard} tone="green" /></li>
        <li><StatTile label="Refunded" value={rupees(refunded)} icon={RotateCcw} tone="rose" /></li>
        <li><StatTile label="Invoices" value={String(orders.length)} icon={FileText} tone="blue" /></li>
      </ul>
      <SimpleTable rows={orders} rowKey={(o) => o.invoiceNumber} caption="Tax invoices and payments, newest first." empty="No invoices yet."
        columns={[
          { header: "Invoice", cell: (o) => <span className="font-mono text-xs">{o.invoiceNumber}</span> },
          { header: "Date", cell: (o) => o.placed, className: "whitespace-nowrap" },
          { header: "Order", cell: (o) => <Link href={`/account/orders/${o.number}`} className="font-mono text-xs text-primary hover:underline">{o.number}</Link> },
          { header: "Paid with", cell: (o) => o.method, className: "whitespace-nowrap text-muted-foreground" },
          { header: "GST", align: "right", cell: (o) => rupees(o.totals.gstIncludedPaise) },
          { header: "Amount", align: "right", cell: (o) => <span className="font-medium">{rupees(o.totals.totalPaise)}</span> },
          { header: "Status", cell: (o) => o.status === "refunded" ? <StatusBadge tone="muted">Refunded</StatusBadge> : <StatusBadge tone="good">Paid</StatusBadge> },
          { header: "Document", cell: (o) => <Link href={`/account/billing/${o.invoiceNumber}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Download aria-hidden="true" /> View</Link> },
        ]} />
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> We don&apos;t store card or UPI details. Payments are handled on Razorpay&apos;s secure page.</p>
    </>
  )
}
