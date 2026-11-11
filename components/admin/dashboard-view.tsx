"use client"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight, Boxes, PackagePlus, ShoppingBag, Ticket } from "lucide-react"
import { CategoryDonut, Spark, StatusStack, TopProducts, WeekdayBars, type DayBar, type Slice, type StatusSlice } from "./charts/breakdowns"
import { OrdersChart, RevenueChart } from "./charts/revenue-chart"
import { EmptyChart } from "./charts/shared"
import { CountUp, DeltaChip, ExportButton, Panel, RangeControl, pctChange } from "./desk"
import { OrderStatusBadge, orderStatusMeta } from "./order-status-badge"
import type { Range } from "@/features/admin/analytics"
import { downloadCsv } from "@/features/admin/csv"
import { fmtDateTime, money, number } from "@/features/admin/format"
import { orderTotal } from "@/features/admin/order-math"
import type { OrderStatus } from "@/features/admin/types"
import type { DashboardExtras, DashPerms, ReportData, SalesDay } from "@/lib/db/queries/admin-reports"

/** Decided on the server (IST), so the greeting and date match between server and browser. */
export type DeskInfo = { greeting: string; name: string; weekday: string; day: string; monthYear: string }

const sum = (pts: SalesDay[], k: "revenue" | "orders") => pts.reduce((t, p) => t + p[k], 0)
const plural = (n: number, one: string, many: string) => `${number(n)} ${n === 1 ? one : many}`
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "var(--desk-3)", paid: "var(--desk-2)", packed: "var(--desk-ink)", shipped: "color-mix(in oklab, var(--desk-4) 55%, var(--desk-2))",
  delivered: "var(--desk-4)", cancelled: "var(--desk-6)", refunded: "var(--desk-5)",
}
const STATUS_ORDER: OrderStatus[] = ["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"]
const WEEK = [["Mon", "Monday", 1], ["Tue", "Tuesday", 2], ["Wed", "Wednesday", 3], ["Thu", "Thursday", 4], ["Fri", "Friday", 5], ["Sat", "Saturday", 6], ["Sun", "Sunday", 0]] as const
const WINDOWS = [["overnight, midnight to 6 am", 0, 5], ["mornings, 6 am to noon", 6, 11], ["afternoons, noon to 6 pm", 12, 17], ["evenings, 6 pm to midnight", 18, 23]] as const

/** Top N slices plus one "Other" slice, so the donut always adds up to the whole. */
function rollup(items: Slice[], keep: number): Slice[] {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const rest = sorted.slice(keep).reduce((t, s) => t + s.value, 0)
  return [...sorted.slice(0, keep), ...(rest > 0 ? [{ label: "Other", value: rest }] : [])]
}

/**
 * Everything here comes from the database. The dashboard is open to every staff role, so each block only
 * appears (and was only loaded) when the role may see that data: sales for reports, orders for orders, and so on.
 * `report.series` holds twice the longest range so each period can be compared with the one before it.
 */
export function DashboardView({ report, extras, perms, desk }: { report: ReportData; extras: DashboardExtras; perms: DashPerms; desk: DeskInfo }) {
  const [range, setRange] = useState<Range>(30)
  const all = report.series
  const cur = useMemo(() => all.slice(-range), [all, range])
  const prev = useMemo(() => all.slice(-range * 2, -range), [all, range])
  const revenue = sum(cur, "revenue"), prevRevenue = sum(prev, "revenue")
  const orderCount = sum(cur, "orders"), prevOrders = sum(prev, "orders")
  const aov = orderCount ? Math.round(revenue / orderCount / 100) * 100 : 0, prevAov = prevOrders ? Math.round(prevRevenue / prevOrders / 100) * 100 : 0
  const revPct = pctChange(revenue, prevRevenue)
  const hasSales = revenue > 0 || orderCount > 0

  // Category and product sales are sent per day, so they follow the chosen range like everything else.
  const { slices, products } = useMemo(() => {
    const days = new Set(cur.map((d) => d.date))
    const cats = new Map<string, number>(), prods = new Map<string, { revenue: number; units: number }>()
    for (const r of report.categoryDaily) if (days.has(r.date)) cats.set(r.label, (cats.get(r.label) ?? 0) + r.revenue)
    for (const r of report.productDaily) if (days.has(r.date)) { const p = prods.get(r.title) ?? { revenue: 0, units: 0 }; prods.set(r.title, { revenue: p.revenue + r.revenue, units: p.units + r.units }) }
    return {
      slices: rollup([...cats].map(([label, value]) => ({ label, value })), 5),
      products: [...prods].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 6),
    }
  }, [cur, report.categoryDaily, report.productDaily])

  const statusItems: StatusSlice[] = useMemo(() => STATUS_ORDER.flatMap((s) => {
    const n = extras.statusCounts?.find((x) => x.status === s)?.n ?? 0
    return n > 0 ? [{ key: s, label: s === "pending" ? "Pending" : orderStatusMeta[s].label, n, color: STATUS_COLOR[s] }] : []
  }), [extras.statusCounts])

  const weekday: DayBar[] = useMemo(() => WEEK.map(([day, full, dow]) => ({ day, full, n: report.hourly.filter((h) => h.dow === dow).reduce((t, h) => t + h.n, 0) })), [report.hourly])
  const weekdayTotal = weekday.reduce((t, d) => t + d.n, 0)
  const busiest = WINDOWS.map(([label, from, to]) => ({ label, n: report.hourly.filter((h) => h.hour >= from && h.hour <= to).reduce((t, h) => t + h.n, 0) })).sort((a, b) => b.n - a.n)[0]

  // One sentence that tells the day: sales first (if allowed), then what needs doing.
  const todo = [
    extras.toPack ? `${plural(extras.toPack, "order needs", "orders need")} packing` : null,
    extras.lowCount ? `${plural(extras.lowCount, "product is", "products are")} running low` : null,
  ].filter(Boolean) as string[]
  const salesLine = !perms.reports ? null : !hasSales ? `No sales in the last ${range} days yet.`
    : revPct === null ? `Revenue is ${money(revenue)} over the last ${range} days.`
    : Math.abs(revPct) < 0.5 ? `Revenue is level with the previous ${range} days.`
    : `Revenue is ${revPct > 0 ? "up" : "down"} ${Math.abs(revPct).toFixed(0)}% on the previous ${range} days.`
  const summary = [salesLine, todo.length ? `${todo.join(" and ")}.` : salesLine ? null : "Nothing needs your attention right now."].filter(Boolean).join(" ")

  const quick = [
    perms.catalog && { href: "/admin/products/new", label: "Add product", icon: PackagePlus },
    perms.inventory && { href: "/admin/inventory", label: "Adjust stock", icon: Boxes },
    perms.coupons && { href: "/admin/coupons", label: "Create coupon", icon: Ticket },
    perms.orders && { href: "/admin/orders", label: "Process orders", icon: ShoppingBag },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Boxes }[]

  const attention = [
    extras.toPack !== null && { n: extras.toPack, label: extras.toPack === 1 ? "paid order to pack" : "paid orders to pack", href: "/admin/orders?status=paid" },
    extras.pendingPayment !== null && { n: extras.pendingPayment, label: extras.pendingPayment === 1 ? "order awaiting payment" : "orders awaiting payment", href: "/admin/orders?status=pending" },
    extras.openReturns !== null && { n: extras.openReturns, label: extras.openReturns === 1 ? "return request open" : "return requests open", href: "/admin/returns" },
    extras.newMessages !== null && { n: extras.newMessages, label: extras.newMessages === 1 ? "new inbox message" : "new inbox messages", href: "/admin/inbox" },
    extras.pendingReviews !== null && { n: extras.pendingReviews, label: extras.pendingReviews === 1 ? "review to approve" : "reviews to approve", href: "/admin/reviews" },
  ].filter((x): x is { n: number; label: string; href: string } => !!x && x.n > 0)
  const low = extras.low ?? []
  const showBoard = attention.length > 0 || low.length > 0 || extras.toPack !== null || extras.low !== null || extras.openReturns !== null || extras.newMessages !== null || extras.pendingReviews !== null || quick.length > 0
  const lowerRow = [extras.statusCounts, perms.reports ? report.hourly : null, extras.activity.length ? extras.activity : null].filter(Boolean).length

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-10">
      {/* ---- masthead */}
      <header className="desk-rise grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
          <div className="flex min-w-0 items-start gap-4 sm:gap-6">
            <div aria-hidden="true" className="shrink-0 border-r pr-4 text-center sm:pr-6">
              <p className="font-display text-[4.25rem] font-medium leading-[0.85] text-desk-accent sm:text-[5.5rem]">{desk.day}</p>
              <p className="desk-eyebrow mt-2">{desk.monthYear}</p>
            </div>
            <div className="min-w-0 pt-1">
              <p className="desk-eyebrow">{desk.weekday}</p>
              <h1 className="font-display mt-1 text-[1.75rem] font-medium leading-tight sm:text-4xl">{desk.greeting}, {desk.name}</h1>
              <p className="mt-2 max-w-xl text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">{summary}</p>
            </div>
          </div>
          {perms.reports && (
            <div className="flex flex-wrap items-center gap-2">
              <RangeControl value={range} onChange={setRange} />
              <ExportButton onClick={() => downloadCsv(`sales-last-${range}-days.csv`, [["Date", "Revenue (INR)", "Orders"], ...cur.map((d) => [d.date, d.revenue / 100, d.orders])])} />
            </div>
          )}
        </div>
        <div aria-hidden="true" className="grid gap-[3px]"><div className="h-[3px] bg-foreground" /><div className="h-px bg-foreground" /></div>
      </header>

      {perms.reports && (
        <section aria-label="Sales" className="desk-rise overflow-hidden rounded-2xl border bg-card" style={{ "--i": 1 } as React.CSSProperties}>
          {/* ---- hero KPI band: one dominant figure, three quieter ones, hairlines between */}
          <div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <div className="grid gap-3 p-6 sm:p-8">
              <p className="desk-eyebrow">Revenue · last {range} days</p>
              <p className="font-display text-[clamp(2.75rem,7vw,4.75rem)] font-medium leading-none tracking-tight"><CountUp value={revenue} format={money} /></p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><DeltaChip pct={revPct} label={prevRevenue ? `vs ${money(prevRevenue)} before` : undefined} /></div>
              <div className="-mx-1 mt-1 max-w-lg"><Spark data={cur.map((d) => d.revenue)} /></div>
            </div>
            <ul aria-label="Other key figures" className="grid divide-y border-t xl:border-l xl:border-t-0">
              <Figure label="Orders" value={orderCount} format={number} pct={pctChange(orderCount, prevOrders)} spark={cur.map((d) => d.orders)} />
              <Figure label="Average order" value={aov} format={money} pct={pctChange(aov, prevAov)} spark={cur.map((d) => (d.orders ? d.revenue / d.orders : 0))} />
              {extras.pendingPayment !== null && (
                <li className="flex items-center justify-between gap-4 px-6 py-4 sm:px-8">
                  <div><p className="desk-eyebrow">Awaiting payment</p><p className="font-display mt-1 text-3xl font-medium leading-none"><CountUp value={extras.pendingPayment} format={number} /></p></div>
                  <Link href="/admin/orders?status=pending" className="inline-flex items-center gap-1 text-sm font-medium text-desk-accent hover:underline">Review <ArrowRight className="size-4" aria-hidden="true" /></Link>
                </li>
              )}
            </ul>
          </div>

          {/* ---- the centrepiece */}
          <div className="border-t px-3 pb-4 pt-5 sm:px-6">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-2 sm:px-0">
              <h2 className="font-display text-xl font-semibold">Revenue, day by day</h2>
              <p className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-desk-accent" />This period</span>
                <span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-4 border-t border-dashed border-muted-foreground" />Previous {range} days</span>
              </p>
            </div>
            {hasSales ? (
              <>
                <RevenueChart cur={cur} prev={prev} />
                <div className="mt-1 px-2 sm:px-0"><p className="desk-eyebrow pl-[50px]">Orders per day</p></div>
                <OrdersChart cur={cur} prev={prev} />
              </>
            ) : <EmptyChart className="mt-4 h-64" title={`No sales in the last ${range} days`} hint="Paid orders appear here as they come in. Try a longer range to see earlier trading." />}
          </div>
        </section>
      )}

      {perms.reports && (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-10 xl:grid-cols-12">
          <Panel id="cat-heading" title="Sales by category" className="xl:col-span-5" style={{ "--i": 2 } as React.CSSProperties}>
            {slices.length ? <CategoryDonut slices={slices} centerLabel={`${range} days`} /> : <EmptyChart title="No category sales yet" hint="Once paid orders arrive in this range, you will see which categories carry them." />}
          </Panel>
          <Panel id="top-heading" title="Top products" className="xl:col-span-7" style={{ "--i": 3 } as React.CSSProperties}
            aside={<Link href="/admin/reports" className="inline-flex items-center gap-1 font-medium text-desk-accent hover:underline">Full report <ArrowRight className="size-4" aria-hidden="true" /></Link>}>
            {products.length ? <TopProducts rows={products} /> : <EmptyChart title="No product sales yet" hint="Best sellers show up here, ranked by revenue, once orders are paid." />}
          </Panel>
        </div>
      )}

      {(extras.recentOrders || showBoard) && (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-10 xl:grid-cols-12">
          {extras.recentOrders && (
            <Panel id="recent-heading" title="Recent orders" className="xl:col-span-8" style={{ "--i": 4 } as React.CSSProperties}
              aside={<Link href="/admin/orders" className="inline-flex items-center gap-1 font-medium text-desk-accent hover:underline">All orders <ArrowRight className="size-4" aria-hidden="true" /></Link>}>
              {extras.recentOrders.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No orders yet. The first one will appear here the moment a customer checks out.</p> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm">
                  <thead><tr className="desk-eyebrow border-b"><th className="py-2 pr-3 font-semibold">Order</th><th className="px-3 font-semibold">Customer</th><th className="px-3 font-semibold">Placed</th><th className="px-3 text-right font-semibold">Total</th><th className="py-2 pl-3 font-semibold">Status</th></tr></thead>
                  <tbody>{extras.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-3"><Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold text-desk-accent hover:underline">{o.id}</Link></td>
                      <td className="px-3">{o.customerName}</td><td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDateTime(o.placed)}</td>
                      <td className="price px-3 text-right font-medium">{money(orderTotal(o))}</td><td className="py-3 pl-3"><OrderStatusBadge status={o.status} /></td>
                    </tr>))}</tbody>
                </table></div>
              )}
            </Panel>
          )}
          {showBoard && (
            <section aria-labelledby="board-heading" className={`desk-rise min-w-0 self-start rounded-2xl p-5 sm:p-6 ${extras.recentOrders ? "xl:col-span-4" : "xl:col-span-12 xl:max-w-xl"}`}
              style={{ "--i": 5, background: "var(--desk-board)", color: "var(--desk-board-fg)" } as React.CSSProperties}>
              <h2 id="board-heading" className="font-display text-xl font-semibold">Needs attention</h2>
              {attention.length === 0 && low.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: "var(--desk-board-muted)" }}>All clear. No orders to pack, returns open or products running low.</p>
              ) : (
                <ul className="mt-3 grid grid-cols-[minmax(0,1fr)]">
                  {attention.map((a) => (
                    <li key={a.href} style={{ borderTop: "1px solid var(--desk-board-line)" }}>
                      <Link href={a.href} className="group flex items-center gap-4 py-3">
                        <span className="font-display w-11 text-right text-3xl font-medium leading-none" style={{ color: "var(--desk-board-accent)" }}>{a.n}</span>
                        <span className="flex-1 text-sm">{a.label}</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                  {low.length > 0 && (
                    <li style={{ borderTop: "1px solid var(--desk-board-line)" }} className="pt-3">
                      <div className="flex items-baseline justify-between"><p className="desk-eyebrow" style={{ color: "var(--desk-board-muted)" }}>Running low</p>
                        <Link href="/admin/inventory" className="text-xs font-medium underline-offset-4 hover:underline">{extras.lowCount && extras.lowCount > low.length ? `All ${extras.lowCount}` : "Manage"}</Link></div>
                      <ul className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-1.5">{low.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate">{p.title}</span>
                          <span className="price shrink-0 text-xs font-semibold" style={{ color: p.left === 0 ? "var(--desk-board-accent)" : "var(--desk-board-fg)" }}>{p.left === 0 ? "Out of stock" : `${p.left} left`}</span></li>))}</ul>
                    </li>
                  )}
                </ul>
              )}
              {quick.length > 0 && (
                <ul aria-label="Quick actions" className="mt-4 flex flex-wrap gap-2 pt-4" style={{ borderTop: "1px solid var(--desk-board-line)" }}>
                  {quick.map(({ href, label, icon: Icon }) => (
                    <li key={label}><Link href={href} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10" style={{ border: "1px solid var(--desk-board-line)" }}><Icon className="size-3.5" aria-hidden="true" />{label}</Link></li>))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      {lowerRow > 0 && (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-10 xl:grid-cols-12">
          {extras.statusCounts && (
            <Panel id="status-heading" title="Orders by status" className={lowerRow === 3 ? "xl:col-span-6 wide:col-span-4" : "xl:col-span-6"} style={{ "--i": 6 } as React.CSSProperties}>
              {statusItems.length ? <StatusStack items={statusItems} /> : <EmptyChart title="No orders yet" hint="Every order, from payment pending to delivered, is tallied here." />}
            </Panel>
          )}
          {perms.reports && (
            <Panel id="rhythm-heading" title="Weekly rhythm" className={lowerRow === 3 ? "xl:col-span-6 wide:col-span-4" : "xl:col-span-6"} style={{ "--i": 7 } as React.CSSProperties}
              aside={<span className="text-xs text-muted-foreground">Last 90 days</span>}>
              {weekdayTotal ? (
                <>
                  <WeekdayBars days={weekday} />
                  <p className="mt-2 text-sm text-muted-foreground">Most orders land on <strong className="font-semibold text-foreground">{weekday.reduce((b, d) => (d.n > b.n ? d : b)).full}s</strong>, mainly in the {busiest.label}.</p>
                </>
              ) : <EmptyChart title="No pattern yet" hint="Once a few orders are in, you will see which days and hours are busiest." />}
            </Panel>
          )}
          {extras.activity.length > 0 && (
            <Panel id="activity-heading" title="Recent activity" className={lowerRow === 3 ? "xl:col-span-12 wide:col-span-4" : lowerRow === 1 ? "xl:col-span-12" : "xl:col-span-6"} style={{ "--i": 8 } as React.CSSProperties}>
              <ol className="grid gap-4">{extras.activity.slice(0, 6).map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-desk-accent" />
                  <span className="min-w-0"><Link href={a.href} className="font-medium hover:text-desk-accent">{a.text}</Link><span className="block text-xs text-muted-foreground">{a.by} · {fmtDateTime(a.at)}</span></span>
                </li>))}</ol>
            </Panel>
          )}
        </div>
      )}

      {!perms.reports && !perms.orders && !perms.inventory && quick.length === 0 && attention.length === 0 && <p className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">Your role doesn&apos;t include any dashboard widgets. Use the sidebar to open the sections you can work in.</p>}
    </div>
  )
}

function Figure({ label, value, format, pct, spark }: { label: string; value: number; format: (n: number) => string; pct: number | null; spark: number[] }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-4 px-6 py-4 sm:px-8">
      <div>
        <p className="desk-eyebrow">{label}</p>
        <p className="font-display mt-1 text-3xl font-medium leading-none"><CountUp value={value} format={format} /></p>
        <div className="mt-2"><DeltaChip pct={pct} /></div>
      </div>
      <Spark data={spark} tone="ink" />
    </li>
  )
}
