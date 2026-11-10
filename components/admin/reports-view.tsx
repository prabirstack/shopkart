"use client"
import { useMemo, useState } from "react"
import { Download } from "lucide-react"
import { AreaChart, BarList } from "./charts"
import { PageHeader } from "./page-header"
import { formatShortDate, type Range } from "@/features/admin/analytics"
import { downloadCsv } from "@/features/admin/csv"
import { fmtDate, money, moneyCompact, number } from "@/features/admin/format"
import type { ReportData, SalesDay } from "@/lib/db/queries/admin-reports"

const TABS = [["sales", "Sales"], ["gst", "GST summary"], ["products", "Products"]] as const
const btn = "inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted"

const total = (pts: SalesDay[], k: "revenue" | "orders") => pts.reduce((t, p) => t + p[k], 0)

export function ReportsView({ report }: { report: ReportData }) {
  const { gstRows, productRows } = report
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("sales")
  const [range, setRange] = useState<Range>(30)

  const series = useMemo(() => report.series.slice(-range), [report.series, range])
  const weekly = useMemo(() => {
    const out: { week: string; orders: number; revenue: number }[] = []
    for (let i = 0; i < series.length; i += 7) { const chunk = series.slice(i, i + 7); out.push({ week: `${formatShortDate(chunk[0].date)} to ${formatShortDate(chunk.at(-1)!.date)}`, orders: total(chunk, "orders"), revenue: total(chunk, "revenue") }) }
    return out.reverse()
  }, [series])

  // GST and product figures come from orders that were paid and not later cancelled or refunded.
  const totalGst = gstRows.reduce((t, r) => t + r.gst, 0), totalTaxable = gstRows.reduce((t, r) => t + r.taxable, 0)

  return (
    <>
      <PageHeader title="Reports" description="Sales, tax and product performance. Money figures come from paid orders, so they reconcile with the orders table.">
        <button className={btn} onClick={() => {
          if (tab === "sales") downloadCsv(`sales-last-${range}-days.csv`, [["Date", "Revenue (INR)", "Orders"], ...series.map((d) => [d.date, d.revenue / 100, d.orders])])
          else if (tab === "gst") downloadCsv("gst-summary.csv", [["GST rate %", "Taxable value (INR)", "CGST (INR)", "SGST (INR)", "Total GST (INR)"], ...gstRows.map((r) => [r.rate, r.taxable / 100, r.cgst / 100, r.sgst / 100, r.gst / 100])])
          else downloadCsv("products.csv", [["Product", "Units sold", "Revenue (INR)"], ...productRows.map((r) => [r.title, r.units, r.revenue / 100])])
        }}><Download className="size-4" aria-hidden="true" /> Export CSV</button>
      </PageHeader>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 pt-2">
          <div role="tablist" aria-label="Reports" className="flex gap-1">{TABS.map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium ${tab === v ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>)}</div>
          {tab === "sales" && <div role="group" aria-label="Date range" className="mb-2 flex rounded-lg border p-0.5 text-sm">{([7, 30, 90] as Range[]).map((r) => <button key={r} aria-pressed={range === r} onClick={() => setRange(r)} className={`rounded-md px-3 py-1 font-medium ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{r}d</button>)}</div>}
        </div>
        {tab === "sales" ? (
          <div className="grid gap-6 p-5">
            <div className="grid grid-cols-3 gap-3 text-sm">{[["Revenue", moneyCompact(total(series, "revenue"))], ["Orders", number(total(series, "orders"))], ["Average order", money(total(series, "orders") ? Math.round(total(series, "revenue") / total(series, "orders")) : 0)]].map(([l, v]) => <div key={l} className="rounded-xl border p-3"><p className="text-muted-foreground">{l}</p><p className="price text-xl font-bold">{v}</p></div>)}</div>
            <AreaChart points={series.map((d) => ({ label: formatShortDate(d.date), value: d.revenue }))} format={money} />
            <div className="overflow-x-auto"><table className="w-full min-w-[28rem] text-left text-sm"><caption className="sr-only">Weekly sales</caption><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="py-2 font-medium">Week</th><th className="px-3 text-right font-medium">Orders</th><th className="px-3 text-right font-medium">Revenue</th><th className="text-right font-medium">Avg order</th></tr></thead>
              <tbody>{weekly.map((w) => <tr key={w.week} className="border-b last:border-0"><td className="py-2.5">{w.week}</td><td className="price px-3 text-right">{w.orders}</td><td className="price px-3 text-right font-medium">{money(w.revenue)}</td><td className="price text-right text-muted-foreground">{money(Math.round(w.revenue / (w.orders || 1)))}</td></tr>)}</tbody></table></div>
          </div>
        ) : tab === "gst" ? (
          <div className="grid gap-5 p-5">
            <div className="grid gap-3 sm:grid-cols-3">{[["Taxable value", money(totalTaxable)], ["GST collected", money(totalGst)], ["Orders counted", String(report.countedOrders)]].map(([l, v]) => <div key={l} className="rounded-xl border p-3"><p className="text-sm text-muted-foreground">{l}</p><p className="price text-xl font-bold">{v}</p></div>)}</div>
            <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm"><caption className="sr-only">GST summary by rate</caption><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="py-2 font-medium">GST rate</th><th className="px-3 text-right font-medium">Taxable value</th><th className="px-3 text-right font-medium">CGST</th><th className="px-3 text-right font-medium">SGST</th><th className="text-right font-medium">Total GST</th></tr></thead>
              <tbody>{gstRows.map((r) => <tr key={r.rate} className="border-b"><td className="py-2.5 font-medium">{r.rate}%</td><td className="price px-3 text-right">{money(r.taxable)}</td><td className="price px-3 text-right">{money(r.cgst)}</td><td className="price px-3 text-right">{money(r.sgst)}</td><td className="price text-right font-semibold">{money(r.gst)}</td></tr>)}
                <tr className="font-semibold"><td className="py-2.5">Total</td><td className="price px-3 text-right">{money(totalTaxable)}</td><td className="price px-3 text-right">{money(gstRows.reduce((t, r) => t + r.cgst, 0))}</td><td className="price px-3 text-right">{money(gstRows.reduce((t, r) => t + r.sgst, 0))}</td><td className="price text-right">{money(totalGst)}</td></tr></tbody></table></div>
            <p className="text-xs text-muted-foreground">Assumes same-state supply (CGST plus SGST). Cancelled and refunded orders are excluded. Check the figures with your accountant before filing.</p>
          </div>
        ) : (
          <div className="grid gap-6 p-5 lg:grid-cols-2">
            <section aria-labelledby="pr-h"><h2 id="pr-h" className="mb-4 font-semibold">Revenue by product</h2><BarList items={productRows.slice(0, 8).map((r) => ({ label: r.title, value: r.revenue }))} format={money} /></section>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Units sold by product</caption><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="px-3 text-right font-medium">Units</th><th className="text-right font-medium">Revenue</th></tr></thead>
              <tbody>{productRows.map((r) => <tr key={r.title} className="border-b last:border-0"><td className="py-2.5">{r.title}</td><td className="price px-3 text-right">{r.units}</td><td className="price text-right font-medium">{money(r.revenue)}</td></tr>)}</tbody></table></div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Order data as of {fmtDate(report.asOf)}. Total of counted orders: {money(report.countedTotalPaise)}.</p>
    </>
  )
}
