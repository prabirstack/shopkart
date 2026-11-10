import Link from "next/link"
import { Suspense } from "react"
import { ChevronRight, CreditCard, MapPin, Package, ShoppingBag, Ticket, Truck } from "lucide-react"
import { OrderProgress } from "@/components/account/order-progress"
import { OrderThumbs } from "@/components/account/order-thumbs"
import { StatTile } from "@/components/account/stat-tile"
import { OrderStatusPill } from "@/components/account/status-pill"
import { ProductRow } from "@/components/store/product-row"
import { SectionHeader } from "@/components/store/section-header"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { countsAsSpent, formatDate, isInProgress } from "@/features/account/orders"
import { productHints, thumbsOf } from "@/features/account/products"
import { requireUser } from "@/features/account/session"
import { getTopSelling } from "@/features/catalog/data"
import { getAccountCounts, listActiveCoupons, listCouponUsesForUser, listOrdersForUser } from "@/lib/db/queries"
import { formatMoney } from "@/lib/money"

// Personal page: it reads the session and the database on every request, so there is no static shell to prerender.
export const instant = false

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

async function Overview() {
  const user = await requireUser("/account")
  const [orders, counts, active, used] = await Promise.all([listOrdersForUser(user.id), getAccountCounts(user.id), listActiveCoupons(), listCouponUsesForUser(user.id)])
  const hints = await productHints(orders)
  const spentOrders = orders.filter((o) => countsAsSpent(o.status))
  const spent = spentOrders.reduce((s, o) => s + o.totalPaise, 0)
  const inProgressList = orders.filter((o) => isInProgress(o.status))
  const inProgress = inProgressList[0]
  const usedCodes = new Set(used.map((u) => u.code))
  const usable = active.filter((c) => !usedCodes.has(c.code))

  return (
    <>
      <section aria-labelledby="welcome" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-red-950 to-primary p-6 text-white shadow-lg sm:p-8">
        <ShoppingBag aria-hidden="true" className="absolute -bottom-8 -right-4 size-48 text-white/10" strokeWidth={1} />
        <span aria-hidden="true" className="absolute -left-10 -top-16 size-48 rounded-full bg-white/5" />
        <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm text-white/70">Welcome back</p>
            <h1 id="welcome" className="store-title mt-1">{user.name.split(" ")[0]}, here&apos;s your account</h1>
            <p className="mt-2 max-w-md text-sm text-white/80">Track orders, download GST invoices and use your saved coupons in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/help/track-order" className={buttonVariants({ variant: "secondary", size: "lg" }) + " h-11 bg-white text-primary hover:bg-white/90"}><Truck aria-hidden="true" /> Track an order</Link>
            <Link href="/deals" className={buttonVariants({ size: "lg" }) + " h-11 border border-white/30 bg-white/10 hover:bg-white/20"}>Shop deals</Link>
          </div>
        </div>
      </section>

      <ul aria-label="Account summary" className="grid gap-3 sm:grid-cols-2">
        <li><StatTile label="Orders" value={String(orders.length)} note={inProgressList.length > 0 ? `${inProgressList.length} on the way` : orders.length > 0 ? "None in progress" : "No orders yet"} icon={Package} tone="blue" href="/account/orders" /></li>
        <li><StatTile label="Total spent" value={rupees(spent)} note={`Across ${spentOrders.length} ${spentOrders.length === 1 ? "order" : "orders"}`} icon={CreditCard} tone="green" href="/account/billing" /></li>
        <li><StatTile label="Active coupons" value={String(usable.length)} note={usable[0] ? `${usable[0].code} · ends ${formatDate(usable[0].expiresAt)}` : undefined} icon={Ticket} tone="amber" href="/account/coupons" /></li>
        <li><StatTile label="Saved addresses" value={String(counts.addresses)} note={counts.defaultAddressLabel ? `Default: ${counts.defaultAddressLabel}` : undefined} icon={MapPin} tone="violet" href="/account/addresses" /></li>
      </ul>

      {inProgress && (
        <section aria-labelledby="in-progress" className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r from-emerald-50 to-card px-5 py-3">
            <h2 id="in-progress" className="flex items-center gap-2 font-semibold"><Truck className="size-4 text-emerald-700" aria-hidden="true" /> {inProgress.status === "shipped" ? "Your order is on its way" : "We're preparing your order"}</h2>
            <OrderStatusPill status={inProgress.status} />
          </div>
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4"><OrderThumbs items={thumbsOf(inProgress, hints)} size="size-14" />
                <div><p className="font-mono text-sm font-semibold">{inProgress.number}</p><p className="text-sm text-muted-foreground">{inProgress.items.map((l) => l.title).join(", ")}</p></div></div>
              <Link href={`/account/orders/${inProgress.number}`} className={buttonVariants({ variant: "outline" })}>View details <ChevronRight aria-hidden="true" /></Link>
            </div>
            <OrderProgress order={inProgress} />
          </div>
        </section>
      )}

      <section aria-labelledby="recent">
        <SectionHeader id="recent" title="Recent orders" href="/account/orders" linkLabel="View all" />
        {orders.length === 0 ? (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">You haven&apos;t placed an order yet. <Link href="/products" className="font-medium text-primary hover:underline">Start shopping</Link></p>
        ) : (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
            {orders.slice(0, 4).map((o) => (
              <li key={o.number}>
                <Link href={`/account/orders/${o.number}`} className="group flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  <OrderThumbs items={thumbsOf(o, hints)} />
                  <span className="min-w-0 flex-1"><span className="block font-mono text-sm font-semibold">{o.number}</span><span className="block truncate text-sm text-muted-foreground">{formatDate(o.placedAt)} · {o.items.map((l) => l.title).join(", ")}</span></span>
                  <OrderStatusPill status={o.status} />
                  <span className="price w-20 text-right font-semibold">{rupees(o.totalPaise)}</span>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recommended">
        <SectionHeader id="recommended" title="Recommended for you" href="/bestsellers" linkLabel="See bestsellers" />
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}><Recommended /></Suspense>
      </section>
    </>
  )
}

async function Recommended() {
  return <ProductRow products={await getTopSelling(5)} label="Recommended products" />
}

export default function AccountOverviewPage() {
  return <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-3xl" />}><Overview /></Suspense>
}
