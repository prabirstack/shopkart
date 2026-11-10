import Link from "next/link"
import { ChevronRight, CreditCard, MapPin, Package, ShoppingBag, Ticket, Truck } from "lucide-react"
import { OrderProgress } from "@/components/account/order-progress"
import { OrderThumbs } from "@/components/account/order-thumbs"
import { StatTile } from "@/components/account/stat-tile"
import { OrderStatusPill } from "@/components/account/status-pill"
import { ProductRow } from "@/components/store/product-row"
import { SectionHeader } from "@/components/store/section-header"
import { buttonVariants } from "@/components/ui/button"
import { addresses, demoUser, orders } from "@/features/account/demo"
import { topSelling } from "@/features/catalog/demo"
import { couponRules } from "@/features/coupons/demo"
import { formatMoney } from "@/lib/money"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

export default function AccountOverviewPage() {
  const counted = orders.filter((o) => o.status !== "refunded")
  const spent = counted.reduce((s, o) => s + o.totals.totalPaise, 0)
  const inProgress = orders.find((o) => o.status === "processing" || o.status === "shipped")
  const activeCoupons = couponRules.filter((c) => c.status === "active")
  const defaultAddress = addresses.find((a) => a.isDefault)

  return (
    <>
      <section aria-labelledby="welcome" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-red-950 to-primary p-6 text-white shadow-lg sm:p-8">
        <ShoppingBag aria-hidden="true" className="absolute -bottom-8 -right-4 size-48 text-white/10" strokeWidth={1} />
        <span aria-hidden="true" className="absolute -left-10 -top-16 size-48 rounded-full bg-white/5" />
        <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm text-white/70">Welcome back</p>
            <h1 id="welcome" className="store-title mt-1">{demoUser.name.split(" ")[0]}, here&apos;s your account</h1>
            <p className="mt-2 max-w-md text-sm text-white/80">Track orders, download GST invoices and use your saved coupons in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/help/track-order" className={buttonVariants({ variant: "secondary", size: "lg" }) + " h-11 bg-white text-primary hover:bg-white/90"}><Truck aria-hidden="true" /> Track an order</Link>
            <Link href="/deals" className={buttonVariants({ size: "lg" }) + " h-11 border border-white/30 bg-white/10 hover:bg-white/20"}>Shop deals</Link>
          </div>
        </div>
      </section>

      <ul aria-label="Account summary" className="grid gap-3 sm:grid-cols-2">
        <li><StatTile label="Orders" value={String(orders.length)} note={inProgress ? "1 on its way" : "All delivered"} icon={Package} tone="blue" href="/account/orders" /></li>
        <li><StatTile label="Total spent" value={rupees(spent)} note={`Across ${counted.length} orders`} icon={CreditCard} tone="green" href="/account/billing" /></li>
        <li><StatTile label="Active coupons" value={String(activeCoupons.length)} note={activeCoupons[0] ? `${activeCoupons[0].code} · ends ${activeCoupons[0].expires}` : undefined} icon={Ticket} tone="amber" href="/account/coupons" /></li>
        <li><StatTile label="Saved addresses" value={String(addresses.length)} note={defaultAddress ? `Default: ${defaultAddress.label}` : undefined} icon={MapPin} tone="violet" href="/account/addresses" /></li>
      </ul>

      {inProgress && (
        <section aria-labelledby="in-progress" className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r from-emerald-50 to-card px-5 py-3">
            <h2 id="in-progress" className="flex items-center gap-2 font-semibold"><Truck className="size-4 text-emerald-700" aria-hidden="true" /> {inProgress.status === "shipped" ? "Your order is on its way" : "We're preparing your order"}</h2>
            <OrderStatusPill status={inProgress.status} />
          </div>
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4"><OrderThumbs productIds={inProgress.lines.map((l) => l.productId)} size="size-14" />
                <div><p className="font-mono text-sm font-semibold">{inProgress.number}</p><p className="text-sm text-muted-foreground">{inProgress.lines.map((l) => l.title).join(", ")}</p></div></div>
              <Link href={`/account/orders/${inProgress.number}`} className={buttonVariants({ variant: "outline" })}>View details <ChevronRight aria-hidden="true" /></Link>
            </div>
            <OrderProgress status={inProgress.status} />
          </div>
        </section>
      )}

      <section aria-labelledby="recent">
        <SectionHeader id="recent" title="Recent orders" href="/account/orders" linkLabel="View all" />
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {orders.slice(0, 4).map((o) => (
            <li key={o.number}>
              <Link href={`/account/orders/${o.number}`} className="group flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <OrderThumbs productIds={o.lines.map((l) => l.productId)} />
                <span className="min-w-0 flex-1"><span className="block font-mono text-sm font-semibold">{o.number}</span><span className="block truncate text-sm text-muted-foreground">{o.placed} · {o.lines.map((l) => l.title).join(", ")}</span></span>
                <OrderStatusPill status={o.status} />
                <span className="price w-20 text-right font-semibold">{rupees(o.totals.totalPaise)}</span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recommended">
        <SectionHeader id="recommended" title="Recommended for you" href="/bestsellers" linkLabel="See bestsellers" />
        <ProductRow products={topSelling} label="Recommended products" />
      </section>
    </>
  )
}
