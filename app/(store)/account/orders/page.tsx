import Link from "next/link"
import { Suspense } from "react"
import { PackageOpen } from "lucide-react"
import { OrderStatusPill } from "@/components/account/status-pill"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { orders, type OrderStatus } from "@/features/account/demo"
import { formatMoney } from "@/lib/money"

const filters: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" }, { value: "processing", label: "Processing" }, { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" }, { value: "refunded", label: "Refunded" },
]

async function OrderList({ searchParams }: { searchParams: PageProps<"/account/orders">["searchParams"] }) {
  const raw = (await searchParams).status
  const status = filters.find((f) => f.value === raw)?.value ?? "all"
  const list = orders.filter((o) => status === "all" || o.status === status)
  return (
    <>
      <nav aria-label="Filter orders" className="flex flex-wrap gap-2 text-sm">
        {filters.map((f) => (
          <Link key={f.value} href={f.value === "all" ? "/account/orders" : `/account/orders?status=${f.value}`} aria-current={status === f.value ? "true" : undefined}
            className={`rounded-full border px-3 py-1 ${status === f.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{f.label}</Link>
        ))}
      </nav>
      {list.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader><EmptyMedia variant="icon"><PackageOpen aria-hidden="true" /></EmptyMedia><EmptyTitle>No orders here</EmptyTitle><EmptyDescription>Orders with this status will appear in this list.</EmptyDescription></EmptyHeader>
          <EmptyContent><Link href="/products" className={buttonVariants()}>Start shopping</Link></EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-4">
          {list.map((o) => (
            <li key={o.number} className="rounded-xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-3 text-sm">
                <div className="flex flex-wrap gap-x-8 gap-y-1">
                  <p><span className="block text-xs text-muted-foreground">Order placed</span>{o.placed}</p>
                  <p><span className="block text-xs text-muted-foreground">Total</span><span className="price font-medium">{formatMoney(o.totals.totalPaise, undefined, undefined, { hideZeroDecimals: true })}</span></p>
                  <p><span className="block text-xs text-muted-foreground">Order</span><span className="font-mono">{o.number}</span></p>
                </div>
                <OrderStatusPill status={o.status} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <ul className="grid gap-1 text-sm">
                  {o.lines.map((l) => <li key={l.productId}>{l.title} <span className="text-muted-foreground">× {l.quantity}</span></li>)}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/account/orders/${o.number}`} className={buttonVariants({ variant: "outline" })}>View details</Link>
                  <Link href={`/account/billing/${o.invoiceNumber}`} className={buttonVariants({ variant: "outline" })}>Invoice</Link>
                </div>
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
      <h1 className="store-title !text-3xl">Order history</h1>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}><OrderList searchParams={searchParams} /></Suspense>
    </>
  )
}
