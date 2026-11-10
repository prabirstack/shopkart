import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Check, FileText, Headphones, Undo2, X } from "lucide-react"
import { CancelOrderButton } from "@/components/account/cancel-order-button"
import { OrderReturns } from "@/components/account/order-returns"
import { OrderStatusPill } from "@/components/account/status-pill"
import { SummaryRows } from "@/components/store/order-summary"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TIMELINE, formatDate, invoiceNumber, paymentOf, stepsDone, wasPaid } from "@/features/account/orders"
import { productHints } from "@/features/account/products"
import { requireUser } from "@/features/account/session"
import { getOrderForUser, getReturnEligibility, listReturnsForOrder } from "@/lib/db/queries"
import { formatMoney } from "@/lib/money"

export const instant = false

const money = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

async function OrderDetail({ params }: { params: PageProps<"/account/orders/[id]">["params"] }) {
  const { id } = await params
  const user = await requireUser(`/account/orders/${id}`)
  // The query filters by the signed-in user's id, so another customer's order number is simply "not found".
  const order = await getOrderForUser(id, user.id)
  if (!order) notFound()
  const [hints, returnInfo, returnList] = await Promise.all([productHints([order]), getReturnEligibility(order.number, user.id), listReturnsForOrder(order.number, user.id)])
  const done = stepsDone(order)
  const at = (status: string) => order.events.find((e) => e.status === status)?.at
  const stopped = order.status === "cancelled" || order.status === "refunded"
  const delivered = at("delivered")
  const pay = paymentOf(order)
  const closing = order.events.findLast((e) => e.status === order.status)
  return (
    <>
      <StoreBreadcrumbs trail={[{ label: "Account", href: "/account" }, { label: "Orders", href: "/account/orders" }, { label: order.number }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="store-title !text-3xl">Order {order.number}</h1><p className="mt-1 text-sm text-muted-foreground">Placed {formatDate(order.placedAt)}</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusPill status={order.status} />
          {order.status === "pending" && <CancelOrderButton number={order.number} />}
          {(order.status === "paid" || order.status === "packed") && <Link href="/help" className={buttonVariants({ variant: "outline" })}><Headphones aria-hidden="true" /> Contact support</Link>}
          {returnInfo.eligible && <Link href={`/account/orders/${order.number}/return`} className={buttonVariants({ variant: "outline" })}><Undo2 aria-hidden="true" /> Return items</Link>}
          {wasPaid(order) && <Link href={`/account/billing/${order.number}`} className={buttonVariants({ variant: "outline" })}><FileText aria-hidden="true" /> Invoice</Link>}
        </div>
      </div>
      <section aria-labelledby="track" className="rounded-xl border bg-card p-5">
        <h2 id="track" className="mb-4 font-semibold">{order.status === "cancelled" ? "Order cancelled" : order.status === "refunded" ? "Order refunded" : "Tracking"}</h2>
        <ol className="grid gap-4 sm:grid-cols-5">
          {TIMELINE.map((step, i) => {
            const complete = i < done
            const when = at(step.status)
            return (
              <li key={step.status} className="flex items-center gap-3 sm:block">
                <span className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${complete ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>{complete ? <Check className="size-4" aria-hidden="true" /> : i + 1}</span>
                <span className="sm:mt-2 sm:block"><span className={`block text-sm ${complete ? "font-semibold" : "text-muted-foreground"}`}>{step.label}</span>{when && <span className="block text-xs text-muted-foreground">{formatDate(when)}</span>}<span className="sr-only">{complete ? "completed" : "pending"}</span></span>
              </li>
            )
          })}
        </ol>
        {stopped && (
          <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            {order.status === "cancelled" ? "This order was cancelled" : "This order was refunded"}{closing ? ` on ${formatDate(closing.at)}` : ""}.{closing?.note ? ` ${closing.note}` : ""}</p>
        )}
        {delivered && !stopped && <p className="mt-4 text-sm text-muted-foreground">Delivered on {formatDate(delivered)}. {returnInfo.eligible && returnInfo.deadline ? `You can return items until ${formatDate(returnInfo.deadline)} (${returnInfo.windowDays} days after delivery).` : returnInfo.reason}</p>}
        {order.status === "pending" && <p className="mt-4 text-sm text-muted-foreground">We&apos;re waiting for your payment.</p>}
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-5">
        <section aria-labelledby="items" className="rounded-xl border bg-card p-5">
          <h2 id="items" className="mb-3 font-semibold">Items</h2>
          <ul className="divide-y">
            {order.items.map((l) => {
              const slug = hints[l.productId]?.slug
              return (
                <li key={l.productId} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0">{slug ? <Link href={`/products/${slug}`} className="font-medium hover:text-primary">{l.title}</Link> : <span className="font-medium">{l.title}</span>}<span className="block text-xs text-muted-foreground">Qty {l.quantity} · {money(l.unitPricePaise)} each</span></span>
                  <span className="price font-medium">{money(l.unitPricePaise * l.quantity)}</span>
                </li>
              )
            })}
          </ul>
        </section>
        <OrderReturns returns={returnList} />
        </div>
        <aside className="grid gap-5">
          <section aria-labelledby="pay" className="rounded-xl border bg-card p-5"><h2 id="pay" className="mb-3 font-semibold">Payment</h2><SummaryRows q={order} couponCode={order.couponCode} />
            {pay ? <><p className="mt-3 text-xs text-muted-foreground">Paid by {pay.method}</p><p className="break-all font-mono text-xs text-muted-foreground">{pay.reference}</p></> : <p className="mt-3 text-xs text-muted-foreground">{order.status === "pending" ? "Payment not received yet." : "No payment was taken."}</p>}</section>
          <section aria-labelledby="addr" className="rounded-xl border bg-card p-5 text-sm"><h2 id="addr" className="mb-2 font-semibold">Delivery address</h2>
            <address className="not-italic text-muted-foreground">{order.shipTo.name}<br />{order.shipTo.line1}{order.shipTo.line2 ? `, ${order.shipTo.line2}` : ""}<br />{order.shipTo.city}, {order.shipTo.state} {order.shipTo.pincode}<br />Phone {order.shipTo.phone}</address></section>
          {wasPaid(order) && <p className="text-xs text-muted-foreground">Invoice {invoiceNumber(order.number)}</p>}
        </aside>
      </div>
    </>
  )
}

export default function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}><OrderDetail params={params} /></Suspense>
}
