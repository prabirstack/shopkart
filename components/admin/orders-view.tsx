"use client"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { Check, PackageCheck, Search, Truck } from "lucide-react"
import { OrderStatusBadge } from "./order-status-badge"
import { PageHeader } from "./page-header"
import { fmtDateTime, money } from "@/features/admin/format"
import { adminApi, failureMessage } from "@/features/admin/api"
import { orderTotal } from "@/features/admin/order-math"
import type { AdminOrder, OrderStatus } from "@/features/admin/types"

type Tab = "all" | "action" | "packed" | "shipped" | "delivered" | "closed"
const TABS: { value: Tab; label: string; match: (s: OrderStatus) => boolean }[] = [
  { value: "all", label: "All", match: () => true },
  { value: "action", label: "Needs action", match: (s) => s === "pending" || s === "paid" },
  { value: "packed", label: "Packed", match: (s) => s === "packed" },
  { value: "shipped", label: "Shipped", match: (s) => s === "shipped" },
  { value: "delivered", label: "Delivered", match: (s) => s === "delivered" },
  { value: "closed", label: "Cancelled & refunded", match: (s) => s === "cancelled" || s === "refunded" },
]
export const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  paid: { to: "packed", label: "Mark packed" }, packed: { to: "shipped", label: "Ship" }, shipped: { to: "delivered", label: "Mark delivered" },
}

export function OrdersView({ orders, canFulfil }: { orders: AdminOrder[]; canFulfil: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  // The server only allows the next step in the flow (paid -> packed -> shipped -> delivered).
  const setStatus = async (number: string, to: OrderStatus) => {
    setBusyId(number); setError("")
    try { await adminApi(`admin/orders/${number}/advance`, { method: "POST", body: { to } }); router.refresh() } catch (e) { setError(failureMessage(e)) } finally { setBusyId(null) }
  }
  const initial: Tab = params.get("status") === "pending" ? "action" : "all"
  const [tab, setTab] = useState<Tab>(initial)
  const [q, setQ] = useState("")

  const rows = useMemo(() => {
    const t = TABS.find((x) => x.value === tab)!
    const term = q.trim().toLowerCase()
    return orders.filter((o) => t.match(o.status) && (term === "" || `${o.id} ${o.customerName} ${o.email}`.toLowerCase().includes(term))).sort((a, b) => b.placed.localeCompare(a.placed))
  }, [orders, tab, q])
  const revenue = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded" && o.status !== "pending").reduce((s, o) => s + orderTotal(o), 0)
  const stat = (label: string, value: string) => <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">{label}</p><p className="price mt-1 text-2xl font-bold">{value}</p></li>
  const quick = (o: AdminOrder) => { const n = canFulfil ? NEXT_STEP[o.status] : undefined; return n ? (
    <button disabled={busyId === o.id} onClick={() => void setStatus(o.id, n.to)} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-xs font-semibold hover:border-primary/40 hover:bg-primary/5 hover:text-primary">{n.to === "packed" ? <PackageCheck className="size-3.5" aria-hidden="true" /> : n.to === "shipped" ? <Truck className="size-3.5" aria-hidden="true" /> : <Check className="size-3.5" aria-hidden="true" />}{n.label}</button>
  ) : null }

  return (
    <>
      <PageHeader title="Orders" description="Track every order from payment to delivery." />
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}
      <ul aria-label="Order summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stat("All orders", String(orders.length))}{stat("Needs action", String(orders.filter((o) => o.status === "pending" || o.status === "paid").length))}
        {stat("In transit", String(orders.filter((o) => o.status === "shipped").length))}{stat("Revenue (paid, not refunded)", money(revenue))}
      </ul>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div role="tablist" aria-label="Order status" className="flex gap-1 overflow-x-auto border-b px-3 pt-2">
          {TABS.map((t) => (
            <button key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)} className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${tab === t.value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}<span className={`rounded-full px-2 py-0.5 text-xs ${tab === t.value ? "bg-primary/10" : "bg-muted"}`}>{orders.filter((o) => t.match(o.status)).length}</span>
            </button>
          ))}
        </div>
        <div className="p-3"><div className="relative max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><label htmlFor="o-search" className="sr-only">Search orders</label>
          <input id="o-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, customer or email" className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" /></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Orders</caption>
          <thead><tr className="border-y bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">Order</th><th className="px-3 font-medium">Customer</th><th className="px-3 font-medium">Placed</th><th className="px-3 font-medium">Payment</th><th className="px-3 text-right font-medium">Total</th><th className="px-3 font-medium">Status</th><th className="px-5 text-right font-medium">Next step</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="py-14 text-center text-muted-foreground">No orders in this view.</td></tr>}
            {rows.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-5 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{o.id}</Link><span className="block text-xs text-muted-foreground">{o.lines.length} {o.lines.length === 1 ? "item" : "items"}</span></td>
                <td className="px-3"><span className="font-medium">{o.customerName}</span><span className="block text-xs text-muted-foreground">{o.city}</span></td>
                <td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDateTime(o.placed)}</td><td className="px-3 text-muted-foreground">{o.paymentMethod}</td>
                <td className="price px-3 text-right font-medium">{money(orderTotal(o))}</td><td className="px-3"><OrderStatusBadge status={o.status} /></td><td className="px-5 text-right">{quick(o)}</td>
              </tr>))}
          </tbody>
        </table></div>
      </div>
    </>
  )
}
