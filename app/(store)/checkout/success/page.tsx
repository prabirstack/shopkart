import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { CheckCircle2, Clock, Mail, PackageCheck, PackageX, Truck } from "lucide-react"
import { PurchaseEvent } from "@/features/analytics/purchase-event"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckoutSteps } from "@/components/store/checkout-steps"
import { SummaryRows } from "@/components/store/order-summary"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { auth } from "@/lib/auth"
import { getOrderForUser } from "@/lib/db/queries"
import { formatMoney } from "@/lib/money"
import { RETURN_WINDOW_DAYS } from "@/lib/store-config"

export const metadata: Metadata = { title: "Thank you for your order", robots: { index: false } }
// The page is per-customer (session and order lookup), so it is never prerendered or validated for instant navigation.
export const instant = false

function Notice({ icon: Icon, title, text, action }: { icon: typeof Clock; title: string; text: string; action: { href: string; label: string } }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-2xl border bg-card px-6 py-12 text-center">
      <Icon className="size-12 text-muted-foreground" aria-hidden="true" />
      <h1 className="store-title">{title}</h1>
      <p className="max-w-md text-muted-foreground">{text}</p>
      <Link href={action.href} className={buttonVariants({ size: "lg" }) + " mt-2 h-11"}>{action.label}</Link>
    </div>
  )
}

async function Confirmation({ searchParams }: { searchParams: Promise<{ order?: string | string[] }> }) {
  const raw = (await searchParams).order
  const number = (Array.isArray(raw) ? raw[0] : raw)?.trim().toUpperCase() ?? ""
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/login?next=${encodeURIComponent(`/checkout/success${number ? `?order=${number}` : ""}`)}`)
  const order = number ? await getOrderForUser(number, session.user.id) : null
  if (!order) return <Notice icon={PackageX} title="We couldn't find that order" text="It may belong to a different account. Your orders are listed under your account." action={{ href: "/account/orders", label: "View my orders" }} />
  if (order.status === "pending") return <Notice icon={Clock} title="Payment not completed" text={`Order ${order.number} is saved but not paid yet. You can finish paying or cancel it from checkout.`} action={{ href: "/checkout", label: "Back to checkout" }} />
  if (order.status === "cancelled") return <Notice icon={PackageX} title="This order was cancelled" text={`Order ${order.number} was cancelled. If you paid, the refund is on its way to your original payment method.`} action={{ href: "/account/orders", label: "View my orders" }} />

  const s = order.shipTo
  const payment = order.payments.find((p) => p.status === "captured") ?? order.payments[0]
  const steps = [
    { icon: Mail, title: "Your GST invoice", text: "Download your GST invoice any time from Account, then Billing history. We don't send order emails yet." },
    { icon: PackageCheck, title: "We pack your order", text: "Usually within 1 business day." },
    { icon: Truck, title: "Out for delivery", text: `Delivery to ${s.city} typically takes 3 to 5 days. Returns accepted for ${RETURN_WINDOW_DAYS} days.` },
  ]
  return (
    <>
      <PurchaseEvent orderId={order.number} totalPaise={order.totalPaise} gstPaise={order.gstIncludedPaise} shippingPaise={order.shippingPaise} coupon={order.couponCode}
        lines={order.items.map((i) => ({ id: i.productId, title: i.title, pricePaise: i.unitPricePaise, quantity: i.quantity }))} />
      <div className="grid justify-items-center gap-3 rounded-2xl bg-emerald-50 px-6 py-10 text-center">
        <CheckCircle2 className="size-16 text-emerald-600" aria-hidden="true" />
        <h1 className="store-title">Thank you, {order.customerName.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">Your payment was successful and your order is confirmed.</p>
        <p className="rounded-full bg-background px-4 py-1.5 text-sm">Order <strong className="font-mono">{order.number}</strong></p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-6">
          <section aria-labelledby="next" className="rounded-xl border bg-card p-5">
            <h2 id="next" className="mb-4 font-semibold">What happens next</h2>
            <ol className="grid gap-4">
              {steps.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" aria-hidden="true" /></span>
                  <div><p className="text-sm font-semibold">{title}</p><p className="text-sm text-muted-foreground">{text}</p></div>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="items" className="rounded-xl border bg-card p-5">
            <h2 id="items" className="mb-3 font-semibold">Items</h2>
            <ul className="divide-y">
              {order.items.map((l) => (
                <li key={l.productId} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0"><span className="block font-medium">{l.title}</span><span className="text-xs text-muted-foreground">Qty {l.quantity} · GST {l.gstPercent}% included</span></span>
                  <span className="price shrink-0 font-medium">{formatMoney(l.unitPricePaise * l.quantity, undefined, undefined, { hideZeroDecimals: true })}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="grid gap-4">
          <section aria-labelledby="pay" className="rounded-xl border bg-card p-5">
            <h2 id="pay" className="mb-3 font-semibold">Payment summary</h2>
            <SummaryRows q={order} couponCode={order.couponCode} />
            <p className="mt-3 text-xs text-muted-foreground">Payment {payment?.status === "captured" ? "received" : payment?.status ?? ""}{payment?.method ? ` via ${payment.method}` : ""}</p>
            {payment?.providerPaymentId && <p className="break-all font-mono text-xs text-muted-foreground">Payment ID {payment.providerPaymentId}</p>}
          </section>
          <section aria-labelledby="ship" className="rounded-xl border bg-card p-5 text-sm">
            <h2 id="ship" className="mb-2 font-semibold">Delivering to</h2>
            <address className="not-italic text-muted-foreground">
              {s.name}<br />{s.line1}{s.line2 ? `, ${s.line2}` : ""}<br />{s.city}, {s.state} {s.pincode}<br />{s.phone}
            </address>
          </section>
          <div className="grid gap-2">
            <Link href="/account/orders" className={buttonVariants({ size: "lg" }) + " h-11"}>View my orders</Link>
            <Link href="/products" className={buttonVariants({ variant: "outline", size: "lg" }) + " h-11"}>Continue shopping</Link>
          </div>
        </aside>
      </div>
    </>
  )
}

export default function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string | string[] }> }) {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6">
      <StoreBreadcrumbs trail={[{ label: "Checkout", href: "/checkout" }, { label: "Order confirmed" }]} />
      <CheckoutSteps current={3} />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}><Confirmation searchParams={searchParams} /></Suspense>
    </main>
  )
}
