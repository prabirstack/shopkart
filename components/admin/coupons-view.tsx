"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { fmtDate, money } from "@/features/admin/format"
import { useToday } from "@/features/admin/today"
import { adminApi, ApiFailure, failureMessage } from "@/features/admin/api"
import type { AdminCoupon } from "@/features/admin/types"
import { toCents } from "@/lib/money"

const field = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
const state = (c: AdminCoupon, today: string) => c.expires < today ? "Expired" : c.used >= c.limit ? "Exhausted" : c.active ? "Active" : "Paused"
const tone = { Active: "good", Paused: "muted", Expired: "bad", Exhausted: "warn" } as const
const FIELD_KEY: Record<string, string> = { minOrderPaise: "min", usageLimit: "limit", expiresAt: "expires" }
const blank = { code: "", kind: "percent" as const, value: "10", min: "499", limit: "500", expires: "2026-12-31" }

function CouponDialog({ editing, coupons, open, onClose, onSaved }: { editing: AdminCoupon | null; coupons: AdminCoupon[]; open: boolean; onClose: () => void; onSaved: () => void }) {
  const today = useToday()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const init = editing ? { code: editing.code, kind: editing.kind, value: String(editing.kind === "flat" ? editing.value / 100 : editing.value), min: String(editing.minOrderPaise / 100), limit: String(editing.limit), expires: editing.expires } : blank
  const [f, setF] = useState(init)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = (k: keyof typeof blank, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: "" })) }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = f.code.trim().toUpperCase(), value = Number(f.value), min = Number(f.min), limit = Number(f.limit), er: Record<string, string> = {}
    if (!/^[A-Z0-9]{4,20}$/.test(code)) er.code = "4 to 20 letters or numbers."
    else if (coupons.some((c) => c.code === code && c.id !== editing?.id)) er.code = "That code already exists."
    if (!(value > 0) || (f.kind === "percent" && value > 90)) er.value = f.kind === "percent" ? "Between 1 and 90." : "Above zero."
    if (!(min >= 0)) er.min = "Zero or more."
    if (!Number.isInteger(limit) || limit < 1) er.limit = "A whole number, at least 1."
    if (!f.expires || f.expires < today) er.expires = "Pick a future date."
    setErrs(er); if (Object.keys(er).length) return
    const body = { code, kind: f.kind, value: f.kind === "flat" ? toCents(value) : value, minOrderPaise: toCents(min), usageLimit: limit, expiresAt: `${f.expires}T23:59:59+05:30` }
    setBusy(true); setError("")
    try {
      if (editing) { const patch: Partial<typeof body> = { ...body }; delete patch.code; await adminApi(`admin/coupons/${editing.id}`, { method: "PATCH", body: patch }) }
      else await adminApi("admin/coupons", { method: "POST", body: { ...body, isActive: true } })
      onSaved(); onClose()
    } catch (err) {
      if (err instanceof ApiFailure && err.fields.length) { const fe: Record<string, string> = {}; for (const d of err.fields) fe[FIELD_KEY[d.path] ?? d.path] = d.message; setErrs(fe); setError(Object.keys(fe).some((k) => k in blank) ? "" : err.message) }
      else setError(failureMessage(err))
    } finally { setBusy(false) }
  }
  const row = (k: keyof typeof blank, label: string, type = "text") => (
    <div className="grid gap-1.5"><label htmlFor={`cp-${k}`} className="text-sm font-medium">{label}</label><input id={`cp-${k}`} type={type} value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errs[k] ? true : undefined} className={field} />{errs[k] && <p role="alert" className="text-xs text-destructive">{errs[k]}</p>}</div>)
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent><form onSubmit={submit} className="grid gap-4">
        <DialogHeader><DialogTitle>{editing ? "Edit coupon" : "New coupon"}</DialogTitle><DialogDescription>Terms must match what checkout enforces. Checkout re-validates every coupon on the server.</DialogDescription></DialogHeader>
        {row("code", "Code")}
        <div className="grid grid-cols-2 gap-3"><div className="grid gap-1.5"><label htmlFor="cp-kind" className="text-sm font-medium">Type</label><select id="cp-kind" value={f.kind} onChange={(e) => set("kind", e.target.value)} className={field}><option value="percent">Percent off</option><option value="flat">Flat ₹ off</option></select></div>{row("value", f.kind === "percent" ? "Percent" : "Amount (₹)")}</div>
        <div className="grid grid-cols-2 gap-3">{row("min", "Minimum order (₹)")}{row("limit", "Total uses")}</div>
        {row("expires", "Expires on", "date")}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{editing ? "Save coupon" : "Create coupon"}</Button></DialogFooter>
      </form></DialogContent>
    </Dialog>
  )
}

export function CouponsView({ coupons }: { coupons: AdminCoupon[] }) {
  const today = useToday()
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  // Every change goes through the permission-checked API, then the server re-loads the list.
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError("")
    try { await fn(); router.refresh() } catch (e) { setError(failureMessage(e)) } finally { setBusy(false) }
  }
  const toggle = (c: AdminCoupon) => run(() => adminApi(`admin/coupons/${c.id}`, { method: "PATCH", body: { isActive: !c.active } }))
  const del = (id: string) => run(() => adminApi(`admin/coupons/${id}`, { method: "DELETE" }))
  const [dialog, setDialog] = useState<{ editing: AdminCoupon | null } | null>(null)
  const [removing, setRemoving] = useState<AdminCoupon | null>(null)
  return (
    <>
      <PageHeader title="Coupons" description="Discount codes shoppers can apply in the cart and at checkout."><Button onClick={() => setDialog({ editing: null })}><Plus aria-hidden="true" /> New coupon</Button></PageHeader>
      <ul aria-label="Coupon summary" className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Active coupons</p><p className="price mt-1 text-2xl font-bold">{coupons.filter((c) => state(c, today) === "Active").length}</p></li>
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Times redeemed</p><p className="price mt-1 text-2xl font-bold">{coupons.reduce((s, c) => s + c.used, 0)}</p></li>
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Total coupons</p><p className="price mt-1 text-2xl font-bold">{coupons.length}</p></li>
      </ul>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}
      <div aria-busy={busy} className={`overflow-hidden rounded-2xl border bg-card shadow-xs transition-opacity ${busy ? "opacity-70" : ""}`}><div className="overflow-x-auto"><table className="w-full min-w-[46rem] text-left text-sm"><caption className="sr-only">Coupons</caption>
        <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">Code</th><th className="px-3 font-medium">Discount</th><th className="px-3 font-medium">Usage</th><th className="px-3 font-medium">Expires</th><th className="px-3 font-medium">Status</th><th className="px-3 font-medium">Enabled</th><th className="px-5 text-right font-medium">Actions</th></tr></thead>
        <tbody>{coupons.length === 0 ? <tr><td colSpan={7} className="py-14 text-center text-muted-foreground">No coupons yet.</td></tr> : coupons.map((c) => { const st = state(c, today); const dead = st === "Expired" || st === "Exhausted"; return (
          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
            <td className="px-5 py-3"><span className="rounded-md border border-dashed bg-muted/40 px-2 py-1 font-mono text-xs font-semibold tracking-wider">{c.code}</span></td>
            <td className="px-3"><span className="font-medium">{c.kind === "percent" ? `${c.value}% off` : `${money(c.value)} off`}</span><span className="block text-xs text-muted-foreground">Min order {money(c.minOrderPaise)}</span></td>
            <td className="px-3"><div className="flex min-w-32 items-center gap-2"><span className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (c.used / c.limit) * 100)}%` }} /></span><span className="price text-xs text-muted-foreground">{c.used}/{c.limit}</span></div></td>
            <td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDate(c.expires)}</td><td className="px-3"><StatusBadge tone={tone[st]}>{st}</StatusBadge></td>
            <td className="px-3"><Switch checked={c.active} disabled={dead} onCheckedChange={() => void toggle(c)} aria-label={`${c.active ? "Pause" : "Enable"} ${c.code}`} /></td>
            <td className="px-5 text-right"><div className="flex justify-end gap-1"><button aria-label={`Edit ${c.code}`} onClick={() => setDialog({ editing: c })} className="grid size-8 place-items-center rounded-lg hover:bg-muted"><Pencil className="size-4" aria-hidden="true" /></button><button aria-label={`Delete ${c.code}`} onClick={() => setRemoving(c)} className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" aria-hidden="true" /></button></div></td></tr>) })}</tbody></table></div></div>
      {dialog && <CouponDialog key={dialog.editing?.id ?? "new"} editing={dialog.editing} coupons={coupons} open onClose={() => setDialog(null)} onSaved={() => router.refresh()} />}
      <ConfirmDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)} title={`Delete ${removing?.code}?`} description="Shoppers will no longer be able to use this code. Past orders keep their discount." confirmLabel="Delete coupon" onConfirm={() => { if (removing) void del(removing.id) }} />
    </>
  )
}
