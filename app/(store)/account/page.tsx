import Link from "next/link"
import { CreditCard, MapPin, Package, Ticket } from "lucide-react"
import { OrderStatusPill } from "@/components/account/status-pill"
import { addresses, demoUser, orders } from "@/features/account/demo"
import { couponRules } from "@/features/coupons/demo"
import { formatMoney } from "@/lib/money"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

export default function AccountOverviewPage() {
  const spent = orders.filter((o) => o.status !== "refunded").reduce((s, o) => s + o.totals.totalPaise, 0)
  const stats = [
    { label: "Orders", value: String(orders.length), href: "/account/orders", icon: Package },
    { label: "Total spent", value: rupees(spent), href: "/account/billing", icon: CreditCard },
    { label: "Active coupons", value: String(couponRules.filter((c) => c.status === "active").length), href: "/account/coupons", icon: Ticket },
    { label: "Saved addresses", value: String(addresses.length), href: "/account/addresses", icon: MapPin },
  ]
  return (
    <>
      <div><h1 className="store-title !text-3xl">Hello, {demoUser.name.split(" ")[0]}</h1><p className="mt-1 text-sm text-muted-foreground">Member since {demoUser.joined}.</p></div>
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <li key={label}><Link href={href} className="block rounded-xl border bg-card p-4 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <p className="flex items-center justify-between text-sm text-muted-foreground">{label}<Icon className="size-4" aria-hidden="true" /></p>
            <p className="price mt-2 text-2xl font-bold">{value}</p>
          </Link></li>
        ))}
      </ul>
      <section aria-labelledby="recent">
        <div className="mb-3 flex items-center justify-between"><h2 id="recent" className="section-title">Recent orders</h2><Link href="/account/orders" className="text-sm font-medium text-primary hover:underline">View all</Link></div>
        <ul className="grid gap-3">
          {orders.slice(0, 3).map((o) => (
            <li key={o.number}><Link href={`/account/orders/${o.number}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:shadow-md">
              <span><span className="block font-mono text-sm font-semibold">{o.number}</span><span className="text-xs text-muted-foreground">{o.placed} · {o.lines.length} {o.lines.length === 1 ? "item" : "items"}</span></span>
              <span className="flex items-center gap-4"><OrderStatusPill status={o.status} /><span className="price font-semibold">{rupees(o.totals.totalPaise)}</span></span>
            </Link></li>
          ))}
        </ul>
      </section>
    </>
  )
}
