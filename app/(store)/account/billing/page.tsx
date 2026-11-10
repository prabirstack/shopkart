import Link from "next/link"
import { Download, Info } from "lucide-react"
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
      <h1 className="store-title !text-3xl">Billing history</h1>
      <ul className="grid gap-3 sm:grid-cols-3">
        {[["Total paid", rupees(paid)], ["Refunded", rupees(refunded)], ["Invoices", String(orders.length)]].map(([l, v]) => (
          <li key={l} className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="price mt-1 text-2xl font-bold">{v}</p></li>
        ))}
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
