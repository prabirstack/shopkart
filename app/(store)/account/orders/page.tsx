import Link from "next/link"
import { Suspense } from "react"
import { PackageOpen } from "lucide-react"
import { AccountTitle } from "@/components/account/account-title"
import { OrderProgress } from "@/components/account/order-progress"
import { OrderThumbs } from "@/components/account/order-thumbs"
import { OrderStatusPill } from "@/components/account/status-pill"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { STATUS_FILTERS, formatDate, invoiceNumber, isInProgress, wasPaid } from "@/features/account/orders"
import { productHints, thumbsOf } from "@/features/account/products"
import { requireUser } from "@/features/account/session"
import { listOrdersForUser } from "@/lib/db/queries"
import { formatMoney } from "@/lib/money"

export const instant = false

async function OrderList({ searchParams }: { searchParams: PageProps<"/account/orders">["searchParams"] }) {
  const user = await requireUser("/account/orders")
  const raw = (await searchParams).status
  const status = STATUS_FILTERS.find((f) => f.value === raw)?.value ?? "all"
  const all = await listOrdersForUser(user.id)
  const list = all.filter((o) => status === "all" || o.status === status)
  const hints = await productHints(list)
  return (
    <>
      <nav aria-label="Filter orders" className="flex flex-wrap gap-2 text-sm">
        {STATUS_FILTERS.map((f) => (
          <Link key={f.value} href={f.value === "all" ? "/account/orders" : `/account/orders?status=${f.value}`} aria-current={status === f.value ? "true" : undefined}
            className={`rounded-full border px-3 py-1 ${status === f.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{f.label}</Link>
        ))}
      </nav>
      {list.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader><EmptyMedia variant="icon"><PackageOpen aria-hidden="true" /></EmptyMedia><EmptyTitle>{all.length === 0 ? "No orders yet" : "No orders here"}</EmptyTitle><EmptyDescription>{all.length === 0 ? "When you place an order it will show up here." : "Orders with this status will appear in this list."}</EmptyDescription></EmptyHeader>
          <EmptyContent><Link href="/products" className={buttonVariants()}>Start shopping</Link></EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-4">
          {list.map((o) => (
            <li key={o.number} className="overflow-hidden rounded-2xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-3 text-sm">
                <div className="flex flex-wrap gap-x-8 gap-y-1">
                  <p><span className="block text-xs text-muted-foreground">Order placed</span>{formatDate(o.placedAt)}</p>
                  <p><span className="block text-xs text-muted-foreground">Total</span><span className="price font-medium">{formatMoney(o.totalPaise, undefined, undefined, { hideZeroDecimals: true })}</span></p>
                  <p><span className="block text-xs text-muted-foreground">Order</span><span className="font-mono">{o.number}</span></p>
                </div>
                <OrderStatusPill status={o.status} />
              </div>
              <div className="grid gap-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <OrderThumbs items={thumbsOf(o, hints)} size="size-14" />
                    <ul className="grid min-w-0 gap-0.5 text-sm">{o.items.map((l) => <li key={l.productId} className="truncate">{l.title} <span className="text-muted-foreground">× {l.quantity}</span></li>)}</ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/account/orders/${o.number}`} className={buttonVariants({ variant: "outline" })}>View details</Link>
                    {wasPaid(o) && <Link href={`/account/billing/${o.number}`} aria-label={`Invoice ${invoiceNumber(o.number)}`} className={buttonVariants({ variant: "outline" })}>Invoice</Link>}
                  </div>
                </div>
                {isInProgress(o.status) && <OrderProgress order={o} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function AccountOrdersPage({ searchParams }: PageProps<"/account/orders">) {
  return (
    <>
      <AccountTitle title="Order history" description="Everything you have bought, newest first." />
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}><OrderList searchParams={searchParams} /></Suspense>
    </>
  )
}
