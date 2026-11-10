"use client"
import { useMemo, useState } from "react"
import { Mail, MapPin, Phone, Search } from "lucide-react"
import { PageHeader } from "./page-header"
import { OrderStatusBadge } from "./order-status-badge"
import { StatusBadge } from "./status-badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fmtDate, money } from "@/features/admin/format"
import { useToday } from "@/features/admin/today"
import type { Customer } from "@/features/admin/types"
import type { AdminCustomerStats } from "@/lib/db/queries/admin-views-extra"

type Segment = "VIP" | "New" | "Active" | "No orders"
const seg = { VIP: "good", New: "info", Active: "muted", "No orders": "warn" } as const
const dayDiff = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000)

const NO_STATS: AdminCustomerStats = { orderCount: 0, spentPaise: 0, lastPlaced: null, orders: [] }

export function CustomersView({ customers, stats }: { customers: Customer[]; stats: Record<string, AdminCustomerStats> }) {
  const today = useToday()
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"all" | Segment>("all")
  const [openId, setOpenId] = useState<string | null>(null)

  const data = useMemo(() => customers.map((c) => {
    const st = stats[c.id] ?? NO_STATS
    const segment: Segment = st.orderCount === 0 ? "No orders" : st.spentPaise >= 5000000 || st.orderCount >= 3 ? "VIP" : dayDiff(today, c.joined) <= 30 ? "New" : "Active"
    return { ...c, mine: st.orders, count: st.orderCount, spent: st.spentPaise, segment, last: st.lastPlaced }
  }), [customers, stats, today])
  const rows = data.filter((c) => (filter === "all" || c.segment === filter) && (q.trim() === "" || `${c.name} ${c.email} ${c.city}`.toLowerCase().includes(q.trim().toLowerCase())))
  const open = data.find((c) => c.id === openId)

  return (
    <>
      <PageHeader title="Customers" description="Everyone with an account, grouped by how they shop." />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative min-w-52 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><label htmlFor="c-search" className="sr-only">Search customers</label><input id="c-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or city" className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" /></div>
          <div role="group" aria-label="Segment" className="flex flex-wrap gap-1 text-sm">{(["all", "VIP", "New", "Active", "No orders"] as const).map((s) => <button key={s} aria-pressed={filter === s} onClick={() => setFilter(s)} className={`rounded-full border px-3 py-1 ${filter === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{s === "all" ? "All" : s}</button>)}</div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[46rem] text-left text-sm"><caption className="sr-only">Customers</caption>
          <thead><tr className="border-y bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">Customer</th><th className="px-3 font-medium">City</th><th className="px-3 font-medium">Joined</th><th className="px-3 text-right font-medium">Orders</th><th className="px-3 text-right font-medium">Total spent</th><th className="px-5 font-medium">Segment</th></tr></thead>
          <tbody>{rows.length === 0 ? <tr><td colSpan={6} className="py-14 text-center text-muted-foreground">No customers match.</td></tr> : rows.map((c) => (
            <tr key={c.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/30" onClick={() => setOpenId(c.id)}>
              <td className="px-5 py-3"><button className="flex items-center gap-3 text-left" onClick={() => setOpenId(c.id)}><span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{c.name[0]}</span><span><span className="block font-medium hover:text-primary">{c.name}</span><span className="text-xs text-muted-foreground">{c.email}{!c.verified && " · unverified"}</span></span></button></td>
              <td className="px-3 text-muted-foreground">{c.city}</td><td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDate(c.joined)}</td><td className="price px-3 text-right">{c.count}</td><td className="price px-3 text-right font-medium">{money(c.spent)}</td><td className="px-5"><StatusBadge tone={seg[c.segment]}>{c.segment}</StatusBadge></td></tr>))}</tbody></table></div>
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="sm:max-w-lg">
          {open && <>
            <DialogHeader><DialogTitle>{open.name}</DialogTitle><DialogDescription>Customer since {fmtDate(open.joined)} · <StatusBadge tone={seg[open.segment]}>{open.segment}</StatusBadge></DialogDescription></DialogHeader>
            <ul className="grid gap-2 text-sm text-muted-foreground"><li className="flex items-center gap-2"><Mail className="size-4" aria-hidden="true" />{open.email}</li><li className="flex items-center gap-2"><Phone className="size-4" aria-hidden="true" />{open.phone}</li><li className="flex items-center gap-2"><MapPin className="size-4" aria-hidden="true" />{open.city}</li></ul>
            <div className="grid grid-cols-2 gap-3"><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Total spent</p><p className="price font-bold">{money(open.spent)}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Orders</p><p className="price font-bold">{open.count}</p></div></div>
            <div><h3 className="mb-2 text-sm font-semibold">Orders</h3>{open.mine.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : <ul className="grid gap-2">{open.mine.map((o) => <li key={o.number}><a href={`/admin/orders/${o.number}`} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"><span className="font-mono text-xs font-semibold text-primary">{o.number}</span><OrderStatusBadge status={o.status} /><span className="price font-medium">{money(o.totalPaise)}</span></a></li>)}</ul>}</div>
          </>}
        </DialogContent>
      </Dialog>
    </>
  )
}
