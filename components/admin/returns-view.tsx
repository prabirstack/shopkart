"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Check, PackageCheck, Undo2, X } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { fmtDateTime, money } from "@/features/admin/format"
import { adminApi, failureMessage } from "@/features/admin/api"
import type { AdminReturn, ReturnStatus } from "@/features/admin/types"

const STEPS: ReturnStatus[] = ["requested", "approved", "received", "refunded"]
const tone = { requested: "warn", approved: "info", received: "info", refunded: "good", rejected: "bad", cancelled: "muted" } as const

export function ReturnsView({ returns }: { returns: AdminReturn[] }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  // The server decides which status changes are allowed and tells us if one isn't.
  const setStatus = async (id: string, status: ReturnStatus) => {
    setBusy(true); setError("")
    try { await adminApi(`admin/returns/${id}`, { method: "PATCH", body: { status } }); router.refresh() } catch (e) { setError(failureMessage(e)) } finally { setBusy(false) }
  }
  const [refunding, setRefunding] = useState<AdminReturn | null>(null)
  const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
  const open = returns.filter((r) => !["refunded", "rejected", "cancelled"].includes(r.status))
  return (
    <>
      <PageHeader title="Returns & refunds" description="Move each return through approval, receipt and refund. Refunds credit the original payment method." />
      <ul aria-label="Returns summary" className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Open returns</p><p className="price mt-1 text-2xl font-bold">{open.length}</p></li>
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Awaiting decision</p><p className="price mt-1 text-2xl font-bold">{returns.filter((r) => r.status === "requested").length}</p></li>
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Refunded to date</p><p className="price mt-1 text-2xl font-bold">{money(returns.filter((r) => r.status === "refunded").reduce((s, r) => s + r.refundPaise, 0))}</p></li>
      </ul>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}
      {returns.length === 0 ? <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">No returns yet.</p> : (
        <ul aria-busy={busy} className={`grid grid-cols-[minmax(0,1fr)] gap-4 transition-opacity ${busy ? "opacity-70" : ""}`}>{returns.map((r) => {
          const step = STEPS.indexOf(r.status)
          return (
            <li key={r.id} className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="flex items-center gap-2 font-semibold"><span className="font-mono text-sm">{r.number}</span><StatusBadge tone={tone[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</StatusBadge></p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.customerName} · order <Link href={`/admin/orders/${r.orderId}`} className="font-mono text-xs font-semibold text-primary hover:underline">{r.orderId}</Link> · requested {fmtDateTime(r.requested)}{r.receivedAt ? ` · received ${fmtDateTime(r.receivedAt)}` : ""}</p>
                  {r.items.length > 0 && <ul aria-label={`Items in ${r.number}`} className="mt-2 grid gap-0.5 text-sm">{r.items.map((i, n) => <li key={n}>{i.title} <span className="text-muted-foreground">x {i.quantity}</span></li>)}</ul>}
                  <p className="mt-2 text-sm">Reason: {r.reason}</p>{r.note && <p className="mt-1 max-w-prose whitespace-pre-line break-words rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">&ldquo;{r.note}&rdquo;</p>}</div>
                <p className="price text-xl font-bold">{money(r.refundPaise)}</p>
              </div>
              {r.status !== "rejected" && r.status !== "cancelled" && (
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">{STEPS.map((s, i) => (
                  <li key={s} className="flex flex-1 items-center gap-2"><span className={`grid size-6 shrink-0 place-items-center rounded-full font-semibold ${i <= step ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>{i <= step ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}</span><span className={`capitalize ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>{i < STEPS.length - 1 && <span aria-hidden="true" className={`h-px flex-1 ${i < step ? "bg-emerald-600" : "bg-border"}`} />}</li>))}</ol>)}
              <div className="flex flex-wrap gap-2">
                {r.status === "requested" && <><button disabled={busy} onClick={() => setStatus(r.id, "approved")} className={`${btn} border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}><Check className="size-3.5" aria-hidden="true" /> Approve</button><button disabled={busy} onClick={() => setStatus(r.id, "rejected")} className={`${btn} text-destructive hover:bg-destructive/5`}><X className="size-3.5" aria-hidden="true" /> Reject</button></>}
                {r.status === "approved" && <button disabled={busy} onClick={() => setStatus(r.id, "received")} className={`${btn} hover:bg-muted`}><PackageCheck className="size-3.5" aria-hidden="true" /> Mark item received</button>}
                {r.status === "received" && <button disabled={busy} onClick={() => setRefunding(r)} className={`${btn} border-primary/40 bg-primary/5 text-primary hover:bg-primary/10`}><Undo2 className="size-3.5" aria-hidden="true" /> Issue refund</button>}
                {r.status === "approved" && <button disabled={busy} onClick={() => setStatus(r.id, "rejected")} className={`${btn} text-destructive hover:bg-destructive/5`}><X className="size-3.5" aria-hidden="true" /> Reject</button>}
                {(r.status === "refunded" || r.status === "rejected" || r.status === "cancelled") && <p className="text-sm text-muted-foreground">{r.status === "cancelled" ? "Cancelled by the customer. " : ""}No further action.</p>}
              </div>
            </li>)})}</ul>)}
      <ConfirmDialog open={refunding !== null} onOpenChange={(o) => !o && setRefunding(null)} destructive={false} title={`Refund ${refunding?.number}?`}
        description={`${refunding ? money(refunding.refundPaise) : ""} will be refunded to ${refunding?.customerName} for order ${refunding?.orderId}, sent back through the original payment method.`} confirmLabel="Issue refund" onConfirm={() => refunding && setStatus(refunding.id, "refunded")} />
    </>
  )
}
