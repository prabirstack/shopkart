"use client"
import { useMemo, useState } from "react"
import { CategoryDonut, Spark, TopProducts, type Slice } from "./charts/breakdowns"
import { OrdersChart, RevenueChart } from "./charts/revenue-chart"
import { EmptyChart } from "./charts/shared"
import { CountUp, DeltaChip, ExportButton, Panel, RangeControl, pctChange } from "./desk"
import { formatShortDate, type Range } from "@/features/admin/analytics"
import { downloadCsv } from "@/features/admin/csv"
import { fmtDate, money, number } from "@/features/admin/format"
import type { ReportData, SalesDay } from "@/lib/db/queries/admin-reports"

const TABS = [["sales", "Sales"], ["gst", "GST summary"], ["products", "Products"]] as const
const total = (pts: SalesDay[], k: "revenue" | "orders") => pts.reduce((t, p) => t + p[k], 0)
const th = "desk-eyebrow border-b py-2 font-semibold"

export function ReportsView({ report }: { report: ReportData }) {
  const { gstRows, productRows } = report
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("sales")
  const [range, setRange] = useState<Range>(30)

  const series = useMemo(() => report.series.slice(-range), [report.series, range])
  const prev = useMemo(() => report.series.slice(-range * 2, -range), [report.series, range])
  const weekly = useMemo(() => {
    const out: { week: string; orders: number; revenue: number }[] = []
    for (let i = 0; i < series.length; i += 7) { const chunk = series.slice(i, i + 7); out.push({ week: `${formatShortDate(chunk[0].date)} to ${formatShortDate(chunk.at(-1)!.date)}`, orders: total(chunk, "orders"), revenue: total(chunk, "revenue") }) }
    return out.reverse()
  }, [series])
  const { slices, products } = useMemo(() => {
    const days = new Set(series.map((d) => d.date))
    const cats = new Map<string, number>(), prods = new Map<string, { revenue: number; units: number }>()
    for (const r of report.categoryDaily) if (days.has(r.date)) cats.set(r.label, (cats.get(r.label) ?? 0) + r.revenue)
    for (const r of report.productDaily) if (days.has(r.date)) { const p = prods.get(r.title) ?? { revenue: 0, units: 0 }; prods.set(r.title, { revenue: p.revenue + r.revenue, units: p.units + r.units }) }
    const sorted: Slice[] = [...cats].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    const rest = sorted.slice(5).reduce((t, s) => t + s.value, 0)
    return { slices: [...sorted.slice(0, 5), ...(rest > 0 ? [{ label: "Other", value: rest }] : [])], products: [...prods].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 6) }
  }, [series, report.categoryDaily, report.productDaily])

  const revenue = total(series, "revenue"), orderCount = total(series, "orders"), prevRevenue = total(prev, "revenue"), prevOrders = total(prev, "orders")
  const aov = orderCount ? Math.round(revenue / orderCount / 100) * 100 : 0, prevAov = prevOrders ? Math.round(prevRevenue / prevOrders / 100) * 100 : 0
  // GST and product figures come from orders that were paid and not later cancelled or refunded.
  const totalGst = gstRows.reduce((t, r) => t + r.gst, 0), totalTaxable = gstRows.reduce((t, r) => t + r.taxable, 0)

  return (
    <div className="grid gap-8">
      <header className="desk-rise grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="desk-eyebrow">Reports</p>
            <h1 className="font-display mt-1 text-4xl font-medium leading-tight">The numbers, reconciled</h1>
            <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">Sales, tax and product performance. Money figures come from paid orders, so they reconcile with the orders table.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tab === "sales" && <RangeControl value={range} onChange={setRange} />}
            <ExportButton onClick={() => {
              if (tab === "sales") downloadCsv(`sales-last-${range}-days.csv`, [["Date", "Revenue (INR)", "Orders"], ...series.map((d) => [d.date, d.revenue / 100, d.orders])])
              else if (tab === "gst") downloadCsv("gst-summary.csv", [["GST rate %", "Taxable value (INR)", "CGST (INR)", "SGST (INR)", "Total GST (INR)"], ...gstRows.map((r) => [r.rate, r.taxable / 100, r.cgst / 100, r.sgst / 100, r.gst / 100])])
              else downloadCsv("products.csv", [["Product", "Units sold", "Revenue (INR)"], ...productRows.map((r) => [r.title, r.units, r.revenue / 100])])
            }} />
          </div>
        </div>
        <div aria-hidden="true" className="grid gap-[3px]"><div className="h-[3px] bg-foreground" /><div className="h-px bg-foreground" /></div>
        <div role="tablist" aria-label="Reports" className="flex gap-1 overflow-x-auto">
          {TABS.map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === v ? "border-desk-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>)}
        </div>
      </header>

      {tab === "sales" ? (
        <div className="grid gap-10">
          <section aria-label="Sales" className="desk-rise overflow-hidden rounded-2xl border bg-card" style={{ "--i": 1 } as React.CSSProperties}>
            <ul aria-label="Key figures" className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <li className="grid gap-2 p-6"><p className="desk-eyebrow">Revenue</p><p className="font-display text-[clamp(2.25rem,5vw,3.25rem)] font-medium leading-none"><CountUp value={revenue} format={money} /></p><DeltaChip pct={pctChange(revenue, prevRevenue)} label="vs previous" /><Spark data={series.map((d) => d.revenue)} /></li>
              <li className="grid gap-2 p-6"><p className="desk-eyebrow">Orders</p><p className="font-display text-[clamp(2.25rem,5vw,3.25rem)] font-medium leading-none"><CountUp value={orderCount} format={number} /></p><DeltaChip pct={pctChange(orderCount, prevOrders)} label="vs previous" /><Spark data={series.map((d) => d.orders)} tone="ink" /></li>
              <li className="grid gap-2 p-6"><p className="desk-eyebrow">Average order</p><p className="font-display text-[clamp(2.25rem,5vw,3.25rem)] font-medium leading-none"><CountUp value={aov} format={money} /></p><DeltaChip pct={pctChange(aov, prevAov)} label="vs previous" /><Spark data={series.map((d) => (d.orders ? d.revenue / d.orders : 0))} tone="ink" /></li>
            </ul>
            <div className="border-t px-3 pb-4 pt-5 sm:px-6">
              <h2 className="font-display mb-1 px-2 text-xl font-semibold sm:px-0">Revenue, day by day</h2>
              {revenue > 0 || orderCount > 0 ? <><RevenueChart cur={series} prev={prev} /><p className="desk-eyebrow mt-1 pl-[58px] sm:pl-[50px]">Orders per day</p><OrdersChart cur={series} prev={prev} /></>
                : <EmptyChart className="mt-4 h-64" title={`No sales in the last ${range} days`} hint="Paid orders appear here as they come in. Try a longer range." />}
            </div>
          </section>
          <div className="grid gap-x-10 gap-y-10 xl:grid-cols-12">
            <Panel id="rc-h" title="Sales by category" className="xl:col-span-5" style={{ "--i": 2 } as React.CSSProperties}>
              {slices.length ? <CategoryDonut slices={slices} centerLabel={`${range} days`} /> : <EmptyChart title="No category sales" hint="Nothing was sold in this range." />}
            </Panel>
            <Panel id="rt-h" title="Top products" className="xl:col-span-7" style={{ "--i": 3 } as React.CSSProperties}>
              {products.length ? <TopProducts rows={products} /> : <EmptyChart title="No product sales" hint="Nothing was sold in this range." />}
            </Panel>
          </div>
          <Panel id="rw-h" title="Week by week" style={{ "--i": 4 } as React.CSSProperties}>
            <div className="overflow-x-auto"><table className="w-full min-w-[28rem] text-left text-sm"><caption className="sr-only">Weekly sales</caption>
              <thead><tr><th className={th}>Week</th><th className={`${th} px-3 text-right`}>Orders</th><th className={`${th} px-3 text-right`}>Revenue</th><th className={`${th} text-right`}>Avg order</th></tr></thead>
              <tbody>{weekly.map((w) => <tr key={w.week} className="border-b transition-colors last:border-0 hover:bg-muted/50"><td className="py-2.5">{w.week}</td><td className="price px-3 text-right">{w.orders}</td><td className="price px-3 text-right font-medium">{money(w.revenue)}</td><td className="price text-right text-muted-foreground">{money(Math.round(w.revenue / (w.orders || 1) / 100) * 100)}</td></tr>)}</tbody></table></div>
          </Panel>
        </div>
      ) : tab === "gst" ? (
        <div className="grid gap-8">
          <ul aria-label="Tax figures" className="desk-rise grid divide-y overflow-hidden rounded-2xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[["Taxable value", totalTaxable, money], ["GST collected", totalGst, money], ["Orders counted", report.countedOrders, number]].map(([l, v, f]) => (
              <li key={l as string} className="grid gap-2 p-6"><p className="desk-eyebrow">{l as string}</p><p className="font-display text-4xl font-medium leading-none"><CountUp value={v as number} format={f as (n: number) => string} /></p></li>
            ))}
          </ul>
          <Panel id="gst-h" title="GST by rate">
            <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm"><caption className="sr-only">GST summary by rate</caption>
              <thead><tr><th className={th}>GST rate</th><th className={`${th} px-3 text-right`}>Taxable value</th><th className={`${th} px-3 text-right`}>CGST</th><th className={`${th} px-3 text-right`}>SGST</th><th className={`${th} text-right`}>Total GST</th></tr></thead>
              <tbody>{gstRows.map((r) => <tr key={r.rate} className="border-b hover:bg-muted/50"><td className="py-2.5 font-medium">{r.rate}%</td><td className="price px-3 text-right">{money(r.taxable)}</td><td className="price px-3 text-right">{money(r.cgst)}</td><td className="price px-3 text-right">{money(r.sgst)}</td><td className="price text-right font-semibold">{money(r.gst)}</td></tr>)}
                <tr className="font-semibold"><td className="py-3">Total</td><td className="price px-3 text-right">{money(totalTaxable)}</td><td className="price px-3 text-right">{money(gstRows.reduce((t, r) => t + r.cgst, 0))}</td><td className="price px-3 text-right">{money(gstRows.reduce((t, r) => t + r.sgst, 0))}</td><td className="price text-right">{money(totalGst)}</td></tr></tbody></table></div>
            <p className="mt-4 text-xs text-muted-foreground">Assumes same-state supply (CGST plus SGST). Cancelled and refunded orders are excluded. Check the figures with your accountant before filing.</p>
          </Panel>
        </div>
      ) : (
        <div className="grid gap-x-10 gap-y-10 xl:grid-cols-12">
          <Panel id="pr-h" title="Revenue by product" className="xl:col-span-6">
            {productRows.length ? <TopProducts rows={productRows.slice(0, 8).map((r) => ({ label: r.title, revenue: r.revenue, units: r.units }))} /> : <EmptyChart title="No product sales" hint="Paid orders will rank your products here." />}
          </Panel>
          <Panel id="pt-h" title="All products" className="xl:col-span-6">
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Units sold by product</caption>
              <thead><tr><th className={th}>Product</th><th className={`${th} px-3 text-right`}>Units</th><th className={`${th} text-right`}>Revenue</th></tr></thead>
              <tbody>{productRows.map((r) => <tr key={r.title} className="border-b transition-colors last:border-0 hover:bg-muted/50"><td className="py-2.5">{r.title}</td><td className="price px-3 text-right">{r.units}</td><td className="price text-right font-medium">{money(r.revenue)}</td></tr>)}</tbody></table></div>
          </Panel>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Order data as of {fmtDate(report.asOf)}. Total of counted orders: {money(report.countedTotalPaise)}.</p>
    </div>
  )
}
