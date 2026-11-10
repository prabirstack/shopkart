"use client"
import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertTriangle, ArrowRight, Boxes, Download, IndianRupee, PackagePlus, Percent, ShoppingBag, Target, Ticket, Users } from "lucide-react"
import { AreaChart, BarList, Donut } from "./charts"
import { KpiCard } from "./kpi-card"
import { OrderStatusBadge, orderStatusMeta } from "./order-status-badge"
import { PageHeader } from "./page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { delta, formatShortDate, previousSlice, rangeSlice, sum, topCategories, trafficSources, type Range } from "@/features/admin/analytics"
import { downloadCsv } from "@/features/admin/csv"
import { fmtDateTime, money, moneyCompact, number } from "@/features/admin/format"
import { useAdminReady } from "@/features/admin/hooks"
import { orderTotal, useAdmin } from "@/features/admin/store"
import type { OrderStatus } from "@/features/admin/types"

const RANGES: { value: Range; label: string }[] = [{ value: 7, label: "7 days" }, { value: 30, label: "30 days" }, { value: 90, label: "90 days" }]

export function DashboardView() {
  const ready = useAdminReady()
  const orders = useAdmin((s) => s.orders)
  const products = useAdmin((s) => s.products)
  const movements = useAdmin((s) => s.movements)
  const [range, setRange] = useState<Range>(30)

  const cur = useMemo(() => rangeSlice(range), [range])
  const prev = useMemo(() => previousSlice(range), [range])
  const revenue = sum(cur, "revenue"), prevRevenue = sum(prev, "revenue")
  const orderCount = sum(cur, "orders"), prevOrders = sum(prev, "orders")
  const visitors = sum(cur, "visitors"), prevVisitors = sum(prev, "visitors")
  const aov = revenue / (orderCount || 1), prevAov = prevRevenue / (prevOrders || 1)
  const conv = (orderCount / (visitors || 1)) * 100, prevConv = (prevOrders / (prevVisitors || 1)) * 100

  const statusCounts = useMemo(() => {
    const m = new Map<OrderStatus, number>()
    orders.forEach((o) => m.set(o.status, (m.get(o.status) ?? 0) + 1))
    return [...m.entries()].map(([status, value]) => ({ label: orderStatusMeta[status].label, value }))
  }, [orders])

  const topProducts = useMemo(() => {
    const m = new Map<string, number>()
    orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded").forEach((o) => o.lines.forEach((l) => m.set(l.title, (m.get(l.title) ?? 0) + l.pricePaise * l.quantity)))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }))
  }, [orders])

  const low = products.filter((p) => p.status !== "archived" && p.stock - p.reserved <= p.reorderAt).sort((a, b) => a.stock - a.reserved - (b.stock - b.reserved))
  const activity = useMemo(() => [
    ...orders.flatMap((o) => o.timeline.map((t) => ({ at: t.at, text: `${o.id} ${t.note ?? orderStatusMeta[t.status].label.toLowerCase()}`, by: t.by, href: `/admin/orders/${o.id}` }))),
    ...movements.map((m) => ({ at: m.at, text: `Stock ${m.delta > 0 ? "+" : ""}${m.delta} · ${products.find((p) => p.id === m.productId)?.title ?? m.productId}`, by: m.by, href: "/admin/inventory" })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8), [orders, movements, products])

  const quick = [
    { href: "/admin/products/new", label: "Add product", icon: PackagePlus }, { href: "/admin/inventory", label: "Adjust stock", icon: Boxes },
    { href: "/admin/coupons", label: "Create coupon", icon: Ticket }, { href: "/admin/orders", label: "Process orders", icon: ShoppingBag },
  ]

  return (
    <>
      <PageHeader title="Dashboard" description="Sales, orders and stock at a glance. Figures are sample data for the demo store.">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Date range" className="flex rounded-lg border bg-card p-0.5 text-sm">
            {RANGES.map((r) => (
              <button key={r.value} type="button" aria-pressed={range === r.value} onClick={() => setRange(r.value)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${range === r.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{r.label}</button>
            ))}
          </div>
          <button type="button" onClick={() => downloadCsv(`sales-last-${range}-days.csv`, [["Date", "Revenue (INR)", "Orders", "Visitors"], ...cur.map((d) => [d.date, d.revenue / 100, d.orders, d.visitors])])}
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted"><Download className="size-4" aria-hidden="true" /> Export CSV</button>
        </div>
      </PageHeader>

      <ul aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><KpiCard label="Revenue" value={moneyCompact(revenue)} deltaPct={delta(revenue, prevRevenue)} spark={cur.map((d) => d.revenue)} icon={IndianRupee} tone="green" /></li>
        <li><KpiCard label="Orders" value={number(orderCount)} deltaPct={delta(orderCount, prevOrders)} spark={cur.map((d) => d.orders)} icon={ShoppingBag} tone="blue" /></li>
        <li><KpiCard label="Average order value" value={money(Math.round(aov))} deltaPct={delta(aov, prevAov)} spark={cur.map((d) => d.revenue / (d.orders || 1))} icon={Target} tone="violet" /></li>
        <li><KpiCard label="Conversion rate" value={`${conv.toFixed(2)}%`} deltaPct={delta(conv, prevConv)} spark={cur.map((d) => (d.orders / (d.visitors || 1)) * 100)} icon={Percent} tone="amber" /></li>
      </ul>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="rev-heading" className="min-w-0 rounded-2xl border bg-card p-5 shadow-xs">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div><h2 id="rev-heading" className="font-semibold">Revenue</h2><p className="price text-sm text-muted-foreground">{moneyCompact(revenue)} in the last {range} days</p></div>
            <p className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded bg-primary" />This period</span><span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded border-t border-dashed border-primary/50" />Previous</span></p>
          </div>
          <AreaChart points={cur.map((d) => ({ label: formatShortDate(d.date), value: d.revenue }))} previous={prev.map((d, i) => ({ label: formatShortDate(cur[i].date), value: d.revenue }))} format={money} />
        </section>
        <section aria-labelledby="status-heading" className="rounded-2xl border bg-card p-5 shadow-xs">
          <h2 id="status-heading" className="mb-4 font-semibold">Orders by status</h2>
          {ready ? <Donut segments={statusCounts} centerValue={String(orders.length)} centerLabel="orders" /> : <Skeleton className="h-40 w-full" />}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section aria-labelledby="top-heading" className="rounded-2xl border bg-card p-5 shadow-xs"><h2 id="top-heading" className="mb-4 font-semibold">Top products</h2>{ready ? <BarList items={topProducts} format={money} /> : <Skeleton className="h-40" />}</section>
        <section aria-labelledby="cat-heading" className="rounded-2xl border bg-card p-5 shadow-xs"><h2 id="cat-heading" className="mb-4 font-semibold">Sales by category</h2><BarList items={topCategories} format={moneyCompact} /></section>
        <section aria-labelledby="src-heading" className="rounded-2xl border bg-card p-5 shadow-xs"><h2 id="src-heading" className="mb-4 font-semibold">Traffic sources</h2><BarList items={trafficSources} format={(v) => `${v}%`} /></section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-heading" className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-xs">
          <div className="flex items-center justify-between px-5 py-4"><h2 id="recent-heading" className="font-semibold">Recent orders</h2><Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">View all <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm">
            <thead><tr className="border-y bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">Order</th><th className="px-3 font-medium">Customer</th><th className="px-3 font-medium">Placed</th><th className="px-3 text-right font-medium">Total</th><th className="px-5 font-medium">Status</th></tr></thead>
            <tbody>{(ready ? orders.slice(0, 8) : []).map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-5 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{o.id}</Link></td>
                <td className="px-3">{o.customerName}</td><td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDateTime(o.placed)}</td>
                <td className="price px-3 text-right font-medium">{money(orderTotal(o))}</td><td className="px-5"><OrderStatusBadge status={o.status} /></td>
              </tr>))}</tbody>
          </table></div>
        </section>
        <div className="grid min-w-0 content-start gap-4">
          <section aria-labelledby="quick-heading" className="rounded-2xl border bg-card p-5 shadow-xs">
            <h2 id="quick-heading" className="mb-3 font-semibold">Quick actions</h2>
            <ul className="grid grid-cols-2 gap-2">{quick.map(({ href, label, icon: Icon }) => (
              <li key={label}><Link href={href} className="flex flex-col items-start gap-2 rounded-xl border p-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" aria-hidden="true" /></span>{label}</Link></li>))}</ul>
          </section>
          <section aria-labelledby="low-heading" className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between"><h2 id="low-heading" className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-amber-600" aria-hidden="true" /> Low stock</h2><Link href="/admin/inventory" className="text-sm font-medium text-primary hover:underline">Manage</Link></div>
            {!ready ? <Skeleton className="h-20" /> : low.length === 0 ? <p className="text-sm text-muted-foreground">Every product is well stocked.</p> : (
              <ul className="divide-y">{low.slice(0, 4).map((p) => { const left = Math.max(p.stock - p.reserved, 0); return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="min-w-0 truncate">{p.title}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${left === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{left} left</span></li>) })}</ul>)}
          </section>
        </div>
      </div>

      <section aria-labelledby="activity-heading" className="rounded-2xl border bg-card p-5 shadow-xs">
        <h2 id="activity-heading" className="mb-4 flex items-center gap-2 font-semibold"><Users className="size-4 text-muted-foreground" aria-hidden="true" /> Recent activity</h2>
        {!ready ? <Skeleton className="h-32" /> : (
          <ol className="grid gap-x-10 gap-y-4 md:grid-cols-2">{activity.map((a, i) => (
            <li key={i} className="flex items-start gap-3 text-sm"><span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15" />
              <span className="min-w-0"><Link href={a.href} className="font-medium hover:text-primary">{a.text}</Link><span className="block text-xs text-muted-foreground">{a.by} · {fmtDateTime(a.at)}</span></span></li>))}</ol>)}
      </section>
    </>
  )
}
