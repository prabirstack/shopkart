import Link from "next/link"
import { Suspense } from "react"
import { CreditCard, Download, FileText, Info, RotateCcw } from "lucide-react"
import { AccountTitle } from "@/components/account/account-title"
import { StatTile } from "@/components/account/stat-tile"
import { StatusBadge } from "@/components/admin/status-badge"
import { SimpleTable } from "@/components/admin/simple-table"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, invoiceNumber, paymentOf, wasPaid } from "@/features/account/orders"
import { requireUser } from "@/features/account/session"
import { listOrdersForUser } from "@/lib/db/queries"
import { formatMoney } from "@/lib/money"

export const instant = false

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

async function Billing() {
  const user = await requireUser("/account/billing")
  const orders = (await listOrdersForUser(user.id)).filter(wasPaid)
  const paid = orders.filter((o) => o.status !== "refunded").reduce((s, o) => s + o.totalPaise, 0)
  const refunded = orders.filter((o) => o.status === "refunded").reduce((s, o) => s + o.totalPaise, 0)
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-3">
        <li><StatTile label="Total paid" value={rupees(paid)} icon={CreditCard} tone="green" /></li>
        <li><StatTile label="Refunded" value={rupees(refunded)} icon={RotateCcw} tone="rose" /></li>
        <li><StatTile label="Invoices" value={String(orders.length)} icon={FileText} tone="blue" /></li>
      </ul>
      <SimpleTable rows={orders} rowKey={(o) => o.number} caption="Tax invoices and payments, newest first." empty="No invoices yet. They appear here once an order is paid."
        columns={[
          { header: "Invoice", cell: (o) => <span className="font-mono text-xs">{invoiceNumber(o.number)}</span> },
          { header: "Date", cell: (o) => formatDate(o.placedAt), className: "whitespace-nowrap" },
          { header: "Order", cell: (o) => <Link href={`/account/orders/${o.number}`} className="font-mono text-xs text-primary hover:underline">{o.number}</Link> },
          { header: "Paid with", cell: (o) => paymentOf(o)?.method ?? "Online payment", className: "whitespace-nowrap text-muted-foreground" },
          { header: "GST", align: "right", cell: (o) => rupees(o.gstIncludedPaise) },
          { header: "Amount", align: "right", cell: (o) => <span className="font-medium">{rupees(o.totalPaise)}</span> },
          { header: "Status", cell: (o) => o.status === "refunded" ? <StatusBadge tone="muted">Refunded</StatusBadge> : o.status === "cancelled" ? <StatusBadge tone="bad">Cancelled</StatusBadge> : <StatusBadge tone="good">Paid</StatusBadge> },
          { header: "Document", cell: (o) => <Link href={`/account/billing/${o.number}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Download aria-hidden="true" /> View</Link> },
        ]} />
    </>
  )
}

export default function BillingHistoryPage() {
  return (
    <>
      <AccountTitle title="Billing history" description="Payments, refunds and GST tax invoices." />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}><Billing /></Suspense>
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> We don&apos;t store card or UPI details. Payments are handled on Razorpay&apos;s secure page.</p>
    </>
  )
}
