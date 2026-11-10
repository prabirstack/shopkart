import type { Metadata } from "next"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { CheckCircle2, Mail, PackageCheck, Truck } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SummaryRows } from "@/components/store/order-summary"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { orderNumber, readOrder, type PaidOrder } from "@/features/orders/token"
import { formatMoney } from "@/lib/money"
import { RETURN_WINDOW_DAYS } from "@/lib/store-config"

export const metadata: Metadata = { title: "Thank you for your order | ShopKart", robots: { index: false } }

async function Confirmation() {
  const token = (await cookies()).get("shopkart_last_order")?.value
  const order = token ? await readOrder<PaidOrder>(token) : null
  if (!order || !order.paymentId) redirect("/cart")
  const { customer: c, totals } = order
  const steps = [
    { icon: Mail, title: "Confirmation email", text: `A receipt and GST invoice are on their way to ${c.email}.` },
    { icon: PackageCheck, title: "We pack your order", text: "Usually within 1 business day." },
    { icon: Truck, title: "Out for delivery", text: `Delivery to ${c.city} typically takes 3 to 5 days. Returns accepted for ${RETURN_WINDOW_DAYS} days.` },
  ]
  return (
    <>
      <div className="grid justify-items-center gap-3 rounded-2xl bg-emerald-50 px-6 py-10 text-center">
        <CheckCircle2 className="size-16 text-emerald-600" aria-hidden="true" />
        <h1 className="store-title">Thank you, {c.fullName.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">Your payment was successful and your order is confirmed.</p>
        <p className="rounded-full bg-background px-4 py-1.5 text-sm">Order <strong className="font-mono">{orderNumber(order.orderId)}</strong></p>
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
              {order.lines.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0"><span className="block font-medium">{l.title}</span><span className="text-xs text-muted-foreground">Qty {l.quantity} · GST {l.gstPercent}% included</span></span>
                  <span className="price shrink-0 font-medium">{formatMoney(l.pricePaise * l.quantity, undefined, undefined, { hideZeroDecimals: true })}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="grid gap-4">
          <section aria-labelledby="pay" className="rounded-xl border bg-card p-5">
            <h2 id="pay" className="mb-3 font-semibold">Payment summary</h2>
            <SummaryRows q={totals} couponCode={order.couponCode} />
            <p className="mt-3 break-all font-mono text-xs text-muted-foreground">Payment ID {order.paymentId}</p>
          </section>
          <section aria-labelledby="ship" className="rounded-xl border bg-card p-5 text-sm">
            <h2 id="ship" className="mb-2 font-semibold">Delivering to</h2>
            <address className="not-italic text-muted-foreground">
              {c.fullName}<br />{c.line1}{c.line2 ? `, ${c.line2}` : ""}<br />{c.city}, {c.state} {c.pincode}<br />{c.phone}
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

export default function CheckoutSuccessPage() {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6">
      <StoreBreadcrumbs trail={[{ label: "Checkout", href: "/checkout" }, { label: "Order confirmed" }]} />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}><Confirmation /></Suspense>
    </main>
  )
}
