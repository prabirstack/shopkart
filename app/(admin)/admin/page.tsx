import Link from "next/link"
import { AlertTriangle, Clock, IndianRupee, ShoppingBag, type LucideIcon } from "lucide-react"
import { DemoNotice } from "@/components/admin/demo-notice"
import { OrderTable } from "@/components/admin/order-table"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { available, lowStock, recentOrders } from "@/features/admin/demo"
import { formatMoney } from "@/lib/money"

function Stat({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="price mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

export default function AdminOverviewPage() {
  const revenue = recentOrders.filter((o) => o.status !== "pending" && o.status !== "refunded")
    .reduce((sum, o) => sum + o.totalPaise, 0)
  const pending = recentOrders.filter((o) => o.status === "pending").length
  return (
    <>
      <PageHeader title="Dashboard" description="How the store is doing right now." />
      <DemoNotice />
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat icon={IndianRupee} label="Revenue (paid orders)" value={formatMoney(revenue, undefined, undefined, { hideZeroDecimals: true })} note="Excludes pending and refunded" />
        <Stat icon={ShoppingBag} label="Orders" value={String(recentOrders.length)} note="In the sample list below" />
        <Stat icon={Clock} label="Payment pending" value={String(pending)} note="Waiting on the payment provider" />
        <Stat icon={AlertTriangle} label="Low stock" value={String(lowStock.length)} note="At or below reorder level" />
      </section>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-orders" className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-orders" className="text-lg font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <OrderTable rows={recentOrders.slice(0, 5)} caption="Most recent orders." />
        </section>
        <section aria-labelledby="low-stock" className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="low-stock" className="text-lg font-semibold">Needs restocking</h2>
            <Link href="/admin/inventory" className="text-sm font-medium text-primary hover:underline">Inventory</Link>
          </div>
          <ul className="divide-y rounded-xl border bg-card">
            {lowStock.map((r) => (
              <li key={r.sku} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">{r.sku}</p>
                </div>
                <Badge variant={available(r) === 0 ? "destructive" : "secondary"}>{available(r)} left</Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
