import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Check, FileText } from "lucide-react"
import { OrderStatusPill } from "@/components/account/status-pill"
import { SummaryRows } from "@/components/store/order-summary"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TIMELINE, orderByNumber, orders, progressFor } from "@/features/account/demo"
import { formatMoney } from "@/lib/money"
import { RETURN_WINDOW_DAYS } from "@/lib/store-config"

export function generateStaticParams() { return orders.map((o) => ({ id: o.number })) }

async function OrderDetail({ params }: { params: PageProps<"/account/orders/[id]">["params"] }) {
  const order = orderByNumber((await params).id)
  if (!order) notFound()
  const done = progressFor(order.status)
  const refunded = order.status === "refunded"
  return (
    <>
      <StoreBreadcrumbs trail={[{ label: "Account", href: "/account" }, { label: "Orders", href: "/account/orders" }, { label: order.number }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="store-title !text-3xl">Order {order.number}</h1><p className="mt-1 text-sm text-muted-foreground">Placed {order.placed}</p></div>
        <div className="flex items-center gap-3"><OrderStatusPill status={order.status} /><Link href={`/account/billing/${order.invoiceNumber}`} className={buttonVariants({ variant: "outline" })}><FileText aria-hidden="true" /> Invoice</Link></div>
      </div>
      <section aria-labelledby="track" className="rounded-xl border bg-card p-5">
        <h2 id="track" className="mb-4 font-semibold">{refunded ? "Order delivered, then refunded" : "Tracking"}</h2>
        <ol className="grid gap-4 sm:grid-cols-5">
          {TIMELINE.map((step, i) => {
            const complete = i < done
            return (
              <li key={step} className="flex items-center gap-3 sm:block">
                <span className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${complete ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>{complete ? <Check className="size-4" aria-hidden="true" /> : i + 1}</span>
                <span className="sm:mt-2 sm:block"><span className={`block text-sm ${complete ? "font-semibold" : "text-muted-foreground"}`}>{step}</span><span className="sr-only">{complete ? "completed" : "pending"}</span></span>
              </li>
            )
          })}
        </ol>
        {order.deliveredOn && <p className="mt-4 text-sm text-muted-foreground">Delivered on {order.deliveredOn}. Returns accepted for {RETURN_WINDOW_DAYS} days after delivery.</p>}
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="items" className="rounded-xl border bg-card p-5">
          <h2 id="items" className="mb-3 font-semibold">Items</h2>
          <ul className="divide-y">
            {order.lines.map((l) => (
              <li key={l.productId} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span><Link href={`/products/${orderSlug(l.productId)}`} className="font-medium hover:text-primary">{l.title}</Link><span className="block text-xs text-muted-foreground">Qty {l.quantity} · {formatMoney(l.pricePaise, undefined, undefined, { hideZeroDecimals: true })} each</span></span>
                <span className="price font-medium">{formatMoney(l.pricePaise * l.quantity, undefined, undefined, { hideZeroDecimals: true })}</span>
              </li>
            ))}
          </ul>
        </section>
        <aside className="grid gap-5">
          <section aria-labelledby="pay" className="rounded-xl border bg-card p-5"><h2 id="pay" className="mb-3 font-semibold">Payment</h2><SummaryRows q={order.totals} couponCode={order.couponCode} /><p className="mt-3 text-xs text-muted-foreground">Paid by {order.method}</p><p className="break-all font-mono text-xs text-muted-foreground">{order.paymentId}</p></section>
          <section aria-labelledby="addr" className="rounded-xl border bg-card p-5 text-sm"><h2 id="addr" className="mb-2 font-semibold">Delivery address</h2>
            <address className="not-italic text-muted-foreground">{order.address.name}<br />{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}<br />{order.address.city}, {order.address.state} {order.address.pincode}</address></section>
        </aside>
      </div>
    </>
  )
}

import { productById } from "@/features/catalog/demo"
const orderSlug = (id: string) => productById(id)?.slug ?? ""

export default function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}><OrderDetail params={params} /></Suspense>
}
