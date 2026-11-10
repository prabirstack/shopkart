"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Minus, Plus } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { callApi } from "@/features/account/api"
import { RETURN_NOTE_MAX, RETURN_REASONS, refundForUnits } from "@/lib/returns"
import { formatMoney } from "@/lib/money"
import type { CustomerReturnDTO, ReturnEligibilityLine } from "@/lib/db/queries/returns-customer"

const money = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })
const input = "w-full rounded-lg border bg-background px-3 text-sm shadow-xs outline-none transition hover:border-primary/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 aria-invalid:border-destructive"

/**
 * Pick lines and quantities, say why, and see roughly what comes back. The estimate uses the same rule as the server
 * (lib/returns.ts), but only the server's number counts: it is recomputed when the request is filed.
 */
export function ReturnForm({ orderNumber, lines, deadline }: { orderNumber: string; lines: ReturnEligibilityLine[]; deadline: string | null }) {
  const router = useRouter()
  const [qty, setQty] = useState<Record<string, number>>({})
  const [reason, setReason] = useState<string>("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [fields, setFields] = useState<Record<string, string>>({})
  const [done, setDone] = useState<CustomerReturnDTO | null>(null)

  const units = Object.values(qty).reduce((t, q) => t + q, 0)
  const estimate = useMemo(() => lines.reduce((t, l) => t + refundForUnits(l.lineNetPaise, l.quantity, qty[l.orderItemId] ?? 0), 0), [lines, qty])
  const step = (l: ReturnEligibilityLine, by: number) => setQty((q) => ({ ...q, [l.orderItemId]: Math.min(l.returnable, Math.max(0, (q[l.orderItemId] ?? 0) + by)) }))

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    const f: Record<string, string> = {}
    if (units < 1) f.items = "Choose at least one item to return."
    if (!reason) f.reason = "Choose a reason."
    if (reason === "Other" && !note.trim()) f.note = "Tell us what went wrong."
    setFields(f); setError("")
    if (Object.keys(f).length) return
    setBusy(true)
    const items = lines.filter((l) => (qty[l.orderItemId] ?? 0) > 0).map((l) => ({ orderItemId: l.orderItemId, quantity: qty[l.orderItemId] }))
    const res = await callApi<CustomerReturnDTO>(`/api/v1/orders/${encodeURIComponent(orderNumber)}/returns`, "POST", { items, reason, ...(note.trim() ? { note: note.trim() } : {}) })
    setBusy(false)
    if (!res.ok) { setError(res.message); setFields(res.fields); return }
    setDone(res.data); router.refresh()
  }

  if (done) {
    return (
      <section aria-labelledby="done" className="grid gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" aria-hidden="true" />
          <div role="status">
            <h2 id="done" className="text-lg font-semibold">Return {done.number} requested</h2>
            <p className="mt-1 text-sm text-muted-foreground">We&apos;ll review it shortly. If approved, your refund of <span className="price font-semibold text-foreground">{money(done.refundPaise)}</span> goes back to your original payment method once we receive the items. Shipping isn&apos;t refunded.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3"><Link href={`/account/orders/${orderNumber}`} className={buttonVariants()}>Back to order</Link><Link href="/account/orders" className={buttonVariants({ variant: "outline" })}>All orders</Link></div>
      </section>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid gap-5">
        <fieldset className="rounded-xl border bg-card p-5" aria-describedby={fields.items ? "items-error" : undefined}>
          <legend className="px-1 font-semibold">What are you returning?</legend>
          <ul className="mt-2 divide-y">
            {lines.map((l) => {
              const q = qty[l.orderItemId] ?? 0
              return (
                <li key={l.orderItemId} className={`flex flex-wrap items-center justify-between gap-3 py-3 text-sm ${l.returnable === 0 ? "opacity-60" : ""}`}>
                  <span className="min-w-0 flex-1"><span className="block font-medium">{l.title}</span>
                    <span className="block text-xs text-muted-foreground">{l.returnable === 0 ? "Already in a return" : `Bought ${l.quantity}${l.returned > 0 ? `, ${l.returned} already in a return` : ""} · ${money(l.unitRefundPaise)} each back`}</span></span>
                  {l.returnable > 0 && (
                    <span role="group" aria-label={`Quantity to return for ${l.title}`} className="inline-flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" onClick={() => step(l, -1)} disabled={q === 0} aria-label={`Fewer ${l.title}`}><Minus aria-hidden="true" /></Button>
                      <output aria-live="polite" className="w-10 text-center font-semibold tabular-nums">{q} <span className="sr-only">of {l.returnable}</span></output>
                      <Button type="button" variant="outline" size="icon" onClick={() => step(l, 1)} disabled={q >= l.returnable} aria-label={`More ${l.title}`}><Plus aria-hidden="true" /></Button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          {fields.items && <p id="items-error" role="alert" className="mt-2 text-xs text-destructive">{fields.items}</p>}
        </fieldset>

        <section aria-labelledby="why" className="grid gap-4 rounded-xl border bg-card p-5">
          <h2 id="why" className="font-semibold">Why are you returning it?</h2>
          <div className="grid gap-1.5">
            <label htmlFor="ret-reason" className="text-sm font-medium">Reason</label>
            <div className="relative">
              <select id="ret-reason" value={reason} onChange={(e) => { setReason(e.target.value); setFields((f) => ({ ...f, reason: "" })) }} aria-invalid={fields.reason ? true : undefined} className={`${input} h-10 cursor-pointer appearance-none pr-9`}>
                <option value="" disabled>Select a reason</option>
                {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {fields.reason && <p role="alert" className="text-xs text-destructive">{fields.reason}</p>}
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="ret-note" className="text-sm font-medium">Anything else we should know? {reason !== "Other" && <span className="font-normal text-muted-foreground">(optional)</span>}</label>
            <textarea id="ret-note" value={note} onChange={(e) => { setNote(e.target.value); setFields((f) => ({ ...f, note: "" })) }} rows={4} maxLength={RETURN_NOTE_MAX} aria-invalid={fields.note ? true : undefined} className={`${input} py-2`} />
            <p className="text-xs text-muted-foreground">{note.length} / {RETURN_NOTE_MAX}</p>
            {fields.note && <p role="alert" className="text-xs text-destructive">{fields.note}</p>}
          </div>
        </section>
      </div>

      <aside className="grid gap-4 rounded-xl border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">Refund estimate</h2>
        <p className="flex items-baseline justify-between gap-3 text-sm"><span className="text-muted-foreground">{units} {units === 1 ? "item" : "items"}</span><span className="price text-2xl font-bold" aria-live="polite">{money(estimate)}</span></p>
        <p className="text-xs text-muted-foreground">Goes back to your original payment method after we receive the items. Includes any coupon discount share; delivery charges aren&apos;t refunded. The final amount is confirmed when you submit.</p>
        {deadline && <p className="text-xs text-muted-foreground">You can request returns until {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(deadline))}.</p>}
        {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
        <Button type="submit" disabled={busy} size="lg">{busy && <Loader2 className="animate-spin" aria-hidden="true" />}Request return</Button>
        <Link href={`/account/orders/${orderNumber}`} className={buttonVariants({ variant: "outline" })}>Back to order</Link>
      </aside>
    </form>
  )
}
