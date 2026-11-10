"use client"
import { useState } from "react"
import { Check, PackageCheck, Undo2, X } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fmtDateTime, money } from "@/features/admin/format"
import { useAdminReady } from "@/features/admin/hooks"
import { useAdmin } from "@/features/admin/store"
import type { AdminReturn, ReturnStatus } from "@/features/admin/types"

const STEPS: ReturnStatus[] = ["requested", "approved", "received", "refunded"]
const tone = { requested: "warn", approved: "info", received: "info", refunded: "good", rejected: "bad" } as const

export function ReturnsView() {
  const ready = useAdminReady()
  const returns = useAdmin((s) => s.returns)
  const setStatus = useAdmin((s) => s.setReturnStatus)
  const [refunding, setRefunding] = useState<AdminReturn | null>(null)
  const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
  const open = returns.filter((r) => r.status !== "refunded" && r.status !== "rejected")
  return (
    <>
      <PageHeader title="Returns & refunds" description="Move each return through approval, receipt and refund. Refunds credit the original payment method." />
      <ul aria-label="Returns summary" className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Open returns</p><p className="price mt-1 text-2xl font-bold">{ready ? open.length : "–"}</p></li>
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Awaiting decision</p><p className="price mt-1 text-2xl font-bold">{ready ? returns.filter((r) => r.status === "requested").length : "–"}</p></li>
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Refunded to date</p><p className="price mt-1 text-2xl font-bold">{ready ? money(returns.filter((r) => r.status === "refunded").reduce((s, r) => s + r.refundPaise, 0)) : "–"}</p></li>
      </ul>
      {!ready ? <Skeleton className="h-64 rounded-2xl" /> : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-4">{returns.map((r) => {
          const step = STEPS.indexOf(r.status)
          return (
            <li key={r.id} className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="flex items-center gap-2 font-semibold"><span className="font-mono text-sm">{r.id}</span><StatusBadge tone={tone[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</StatusBadge></p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.customerName} · order {r.orderId} · requested {fmtDateTime(r.requested)}</p><p className="mt-1 text-sm">Reason: {r.reason}</p></div>
                <p className="price text-xl font-bold">{money(r.refundPaise)}</p>
              </div>
              {r.status !== "rejected" && (
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">{STEPS.map((s, i) => (
                  <li key={s} className="flex flex-1 items-center gap-2"><span className={`grid size-6 shrink-0 place-items-center rounded-full font-semibold ${i <= step ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>{i <= step ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}</span><span className={`capitalize ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>{i < STEPS.length - 1 && <span aria-hidden="true" className={`h-px flex-1 ${i < step ? "bg-emerald-600" : "bg-border"}`} />}</li>))}</ol>)}
              <div className="flex flex-wrap gap-2">
                {r.status === "requested" && <><button onClick={() => setStatus(r.id, "approved")} className={`${btn} border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}><Check className="size-3.5" aria-hidden="true" /> Approve</button><button onClick={() => setStatus(r.id, "rejected")} className={`${btn} text-destructive hover:bg-destructive/5`}><X className="size-3.5" aria-hidden="true" /> Reject</button></>}
                {r.status === "approved" && <button onClick={() => setStatus(r.id, "received")} className={`${btn} hover:bg-muted`}><PackageCheck className="size-3.5" aria-hidden="true" /> Mark item received</button>}
                {r.status === "received" && <button onClick={() => setRefunding(r)} className={`${btn} border-primary/40 bg-primary/5 text-primary hover:bg-primary/10`}><Undo2 className="size-3.5" aria-hidden="true" /> Issue refund</button>}
                {(r.status === "refunded" || r.status === "rejected") && <p className="text-sm text-muted-foreground">No further action.</p>}
              </div>
            </li>)})}</ul>)}
      <ConfirmDialog open={refunding !== null} onOpenChange={(o) => !o && setRefunding(null)} destructive={false} title={`Refund ${refunding?.id}?`}
        description={`${refunding ? money(refunding.refundPaise) : ""} will be refunded to ${refunding?.customerName} for order ${refunding?.orderId}, with a GST credit note for the refunded amount.`} confirmLabel="Issue refund" onConfirm={() => refunding && setStatus(refunding.id, "refunded")} />
    </>
  )
}
