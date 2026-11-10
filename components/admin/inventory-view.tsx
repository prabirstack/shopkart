"use client"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AlertTriangle, Boxes, IndianRupee, PackageX, SlidersHorizontal } from "lucide-react"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fmtDateTime, money, number } from "@/features/admin/format"
import { adminApi, failureMessage } from "@/features/admin/api"
import type { AdminProduct, StockMovement, StockReason } from "@/features/admin/types"

const REASONS: { value: StockReason; label: string; sign: "+" | "-" | "±" }[] = [
  { value: "restock", label: "Restock (supplier delivery)", sign: "+" }, { value: "return", label: "Inspected customer return", sign: "+" },
  { value: "damage", label: "Damaged or lost", sign: "-" }, { value: "correction", label: "Manual count correction", sign: "±" },
]
const field = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"

function AdjustDialog({ product, onClose }: { product: AdminProduct | null; onClose: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [dir, setDir] = useState<"add" | "remove">("add")
  const [qty, setQty] = useState("")
  const [reason, setReason] = useState<StockReason>("restock")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const reset = () => { setDir("add"); setQty(""); setReason("restock"); setNote(""); setError("") }
  const close = () => { reset(); onClose() }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || busy) return
    const n = Number(qty)
    if (!Number.isInteger(n) || n <= 0) { setError("Enter a whole number above zero."); return }
    setBusy(true); setError("")
    try {
      // The server records the movement and updates the level in one transaction, and refuses anything that
      // would take stock below zero or below the units reserved for open orders.
      await adminApi(`admin/inventory/${product.id}/adjust`, { method: "POST", body: { delta: dir === "add" ? n : -n, reason, note: note.trim() || undefined } })
      router.refresh(); close()
    } catch (err) { setError(failureMessage(err)) } finally { setBusy(false) }
  }
  return (
    <Dialog open={product !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader><DialogTitle>Adjust stock</DialogTitle><DialogDescription>{product?.title}: {product?.stock} on hand, {product?.reserved} reserved. Every change is recorded as a movement; stock is never overwritten.</DialogDescription></DialogHeader>
          <div role="radiogroup" aria-label="Direction" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
            {(["add", "remove"] as const).map((d) => <button key={d} type="button" role="radio" aria-checked={dir === d} onClick={() => setDir(d)} className={`rounded-md py-2 ${dir === d ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{d === "add" ? "Add stock" : "Remove stock"}</button>)}
          </div>
          <div className="grid gap-1.5"><label htmlFor="qty" className="text-sm font-medium">Quantity</label><input id="qty" value={qty} onChange={(e) => { setQty(e.target.value); setError("") }} inputMode="numeric" aria-invalid={error ? true : undefined} className={field} /></div>
          <div className="grid gap-1.5"><label htmlFor="reason" className="text-sm font-medium">Reason</label><select id="reason" value={reason} onChange={(e) => setReason(e.target.value as StockReason)} className={field}>{REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          <div className="grid gap-1.5"><label htmlFor="note" className="text-sm font-medium">Note{reason === "damage" || reason === "correction" ? " (required)" : " (optional)"}</label><input id="note" value={note} onChange={(e) => { setNote(e.target.value); setError("") }} className={field} /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Record adjustment"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function InventoryView({ products, movements }: { products: AdminProduct[]; movements: StockMovement[] }) {
  const [tab, setTab] = useState<"levels" | "history">("levels")
  const [only, setOnly] = useState(false)
  const [adjusting, setAdjusting] = useState<AdminProduct | null>(null)
  const live = useMemo(() => products.filter((p) => p.status !== "archived"), [products])
  const avail = (p: AdminProduct) => Math.max(p.stock - p.reserved, 0)
  const lowList = live.filter((p) => avail(p) <= p.reorderAt)
  const rows = (only ? lowList : live).slice().sort((a, b) => avail(a) - avail(b))
  const tiles = [
    { label: "Units on hand", value: number(live.reduce((s, p) => s + p.stock, 0)), icon: Boxes, tone: "bg-blue-100 text-blue-700" },
    { label: "Low stock", value: String(lowList.filter((p) => avail(p) > 0).length), icon: AlertTriangle, tone: "bg-amber-100 text-amber-700" },
    { label: "Out of stock", value: String(live.filter((p) => avail(p) === 0).length), icon: PackageX, tone: "bg-rose-100 text-rose-700" },
    { label: "Stock value (at selling price)", value: money(live.reduce((s, p) => s + p.stock * p.pricePaise, 0)), icon: IndianRupee, tone: "bg-emerald-100 text-emerald-700" },
  ]
  return (
    <>
      <PageHeader title="Inventory" description="Available = on hand minus reserved. Adjust with a reason; the history keeps an audit trail." />
      <ul aria-label="Inventory summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{tiles.map(({ label, value, icon: Icon, tone }) => (
        <li key={label} className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon className="size-5" aria-hidden="true" /></span><span><span className="block text-sm text-muted-foreground">{label}</span><span className="price text-xl font-bold">{value}</span></span></li>))}</ul>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 pt-2">
          <div role="tablist" aria-label="Inventory views" className="flex gap-1">{([["levels", "Stock levels"], ["history", "Movement history"]] as const).map(([v, l]) => (
            <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium ${tab === v ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>))}</div>
          {tab === "levels" && <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} className="accent-primary" /> Low stock only</label>}
        </div>
        {tab === "levels" ? (
          <div className="overflow-x-auto"><table className="w-full min-w-[46rem] text-left text-sm"><caption className="sr-only">Stock levels</caption>
            <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">Product</th><th className="px-3 text-right font-medium">On hand</th><th className="px-3 text-right font-medium">Reserved</th><th className="px-3 text-right font-medium">Available</th><th className="px-3 font-medium">Level</th><th className="px-5 text-right font-medium">Action</th></tr></thead>
            <tbody>{rows.map((p) => { const a = avail(p); const pct = Math.min(100, (a / Math.max(p.reorderAt * 3, 1)) * 100); return (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-5 py-3"><span className="font-medium">{p.title}</span><span className="block font-mono text-xs text-muted-foreground">{p.sku}</span></td>
                <td className="price px-3 text-right">{p.stock}</td><td className="price px-3 text-right text-muted-foreground">{p.reserved}</td><td className="price px-3 text-right font-semibold">{a}</td>
                <td className="px-3"><div className="flex min-w-32 items-center gap-2"><span className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span className={`block h-full rounded-full ${a === 0 ? "bg-rose-500" : a <= p.reorderAt ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} /></span>{a === 0 ? <StatusBadge tone="bad">Out</StatusBadge> : a <= p.reorderAt ? <StatusBadge tone="warn">Low</StatusBadge> : <StatusBadge tone="good">Healthy</StatusBadge>}</div></td>
                <td className="px-5 text-right"><button onClick={() => setAdjusting(p)} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary"><SlidersHorizontal className="size-3.5" aria-hidden="true" /> Adjust</button></td></tr>) })}</tbody></table></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-sm"><caption className="sr-only">Stock movements</caption>
            <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">When</th><th className="px-3 font-medium">Product</th><th className="px-3 text-right font-medium">Change</th><th className="px-3 font-medium">Reason</th><th className="px-3 font-medium">Note</th><th className="px-5 font-medium">By</th></tr></thead>
            <tbody>{movements.map((m) => (
              <tr key={m.id} className="border-b last:border-0"><td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{fmtDateTime(m.at)}</td><td className="px-3 font-medium">{products.find((p) => p.id === m.productId)?.title ?? m.productId}</td>
                <td className={`price px-3 text-right font-semibold ${m.delta > 0 ? "text-emerald-700" : "text-rose-700"}`}>{m.delta > 0 ? "+" : ""}{m.delta}</td><td className="px-3 capitalize">{m.reason}</td><td className="px-3 text-muted-foreground">{m.note || "–"}</td><td className="px-5 text-muted-foreground">{m.by}</td></tr>))}</tbody></table></div>
        )}
      </div>
      <AdjustDialog product={adjusting} onClose={() => setAdjusting(null)} />
    </>
  )
}
