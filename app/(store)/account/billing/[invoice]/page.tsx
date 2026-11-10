import { notFound } from "next/navigation"
import { Suspense } from "react"
import { PrintButton } from "@/components/account/print-button"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { invoiceByNumber, orders } from "@/features/account/demo"
import { formatMoney, gstFromInclusive } from "@/lib/money"

const r = (p: number) => formatMoney(p)

export function generateStaticParams() { return orders.map((o) => ({ invoice: o.invoiceNumber })) }

async function Invoice({ params }: { params: PageProps<"/account/billing/[invoice]">["params"] }) {
  const order = invoiceByNumber((await params).invoice)
  if (!order) notFound()
  const rows = order.lines.map((l) => {
    const gross = l.pricePaise * l.quantity
    const gst = gstFromInclusive(gross, l.gstPercent)
    return { ...l, gross, taxable: gross - gst, cgst: Math.floor(gst / 2), sgst: gst - Math.floor(gst / 2) }
  })
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <StoreBreadcrumbs trail={[{ label: "Account", href: "/account" }, { label: "Billing", href: "/account/billing" }, { label: order.invoiceNumber }]} />
        <PrintButton />
      </div>
      <article aria-label={`Invoice ${order.invoiceNumber}`} className="rounded-xl border bg-white p-6 text-sm text-neutral-900 sm:p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
          <div><p className="text-xl font-bold">ShopKart</p><p className="text-xs text-neutral-600">Sample seller · Bengaluru, Karnataka<br />GSTIN: 29ABCDE1234F1Z5 (sample)</p></div>
          <div className="text-right"><p className="text-lg font-semibold">Tax invoice</p><p className="font-mono text-xs">{order.invoiceNumber}</p><p className="text-xs text-neutral-600">Date: {order.placed}</p><p className="text-xs text-neutral-600">Order {order.number}</p></div>
        </header>
        <section className="grid gap-4 border-b py-5 sm:grid-cols-2">
          <div><h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Billed to</h2><address className="mt-1 not-italic">{order.address.name}<br />{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}<br />{order.address.city}, {order.address.state} {order.address.pincode}</address></div>
          <div><h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment</h2><p className="mt-1">{order.method}<br /><span className="break-all font-mono text-xs text-neutral-600">{order.paymentId}</span></p></div>
        </section>
        <div className="overflow-x-auto">
          <table className="price my-5 w-full min-w-[34rem] text-left">
            <caption className="sr-only">Invoice line items with GST split</caption>
            <thead><tr className="border-b text-xs uppercase text-neutral-500"><th className="py-2 pr-2 font-medium">Item</th><th className="px-2 text-right font-medium">Qty</th><th className="px-2 text-right font-medium">Taxable</th><th className="px-2 text-right font-medium">GST %</th><th className="px-2 text-right font-medium">CGST</th><th className="px-2 text-right font-medium">SGST</th><th className="pl-2 text-right font-medium">Amount</th></tr></thead>
            <tbody>{rows.map((x) => (
              <tr key={x.productId} className="border-b"><td className="py-2 pr-2">{x.title}</td><td className="px-2 text-right">{x.quantity}</td><td className="px-2 text-right">{r(x.taxable)}</td><td className="px-2 text-right">{x.gstPercent}%</td><td className="px-2 text-right">{r(x.cgst)}</td><td className="px-2 text-right">{r(x.sgst)}</td><td className="pl-2 text-right">{r(x.gross)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <dl className="price ml-auto grid max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1">
          <dt>Items total</dt><dd className="text-right">{r(order.totals.subtotalPaise)}</dd>
          {order.totals.discountPaise > 0 && (<><dt>Discount ({order.couponCode})</dt><dd className="text-right">−{r(order.totals.discountPaise)}</dd></>)}
          <dt>Delivery</dt><dd className="text-right">{order.totals.shippingPaise === 0 ? "Free" : r(order.totals.shippingPaise)}</dd>
          <dt className="border-t pt-2 font-semibold">Grand total</dt><dd className="border-t pt-2 text-right font-semibold">{r(order.totals.totalPaise)}</dd>
          <dt className="text-xs text-neutral-500">Total GST included</dt><dd className="text-right text-xs text-neutral-500">{r(order.totals.gstIncludedPaise)}</dd>
        </dl>
        <p className="mt-6 text-xs text-neutral-500">Sample invoice for the demo store. Intra-state supply shown as CGST plus SGST. Not a valid tax document.</p>
      </article>
    </>
  )
}

export default function InvoicePage({ params }: PageProps<"/account/billing/[invoice]">) {
  return <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-xl" />}><Invoice params={params} /></Suspense>
}
