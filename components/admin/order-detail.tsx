"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Check, CircleDot, Mail, MapPin, Phone, Printer, StickyNote, Undo2, XCircle } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { NEXT_STEP } from "./orders-view"
import { OrderStatusBadge, orderStatusMeta } from "./order-status-badge"
import { PageHeader } from "./page-header"
import { Button } from "@/components/ui/button"
import { fmtDateTime, money } from "@/features/admin/format"
import { adminApi, failureMessage } from "@/features/admin/api"
import { orderTotal } from "@/features/admin/order-math"
import type { AdminOrder, OrderStatus } from "@/features/admin/types"
import { gstFromInclusive } from "@/lib/money"

export type OrderPerms = { fulfil: boolean; cancel: boolean; refund: boolean }

/** `order` is null when the number matches nothing. What the person may do depends on their role (`perms`). */
export function OrderDetail({ order, perms }: { order: AdminOrder | null; perms: OrderPerms }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState<"cancel" | "refund" | null>(null)
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  // Every change is a permission-checked API call; the server enforces the allowed status flow.
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError("")
    try { await fn(); router.refresh() } catch (e) { setError(failureMessage(e)) } finally { setBusy(false) }
  }
  const setStatus = (to: OrderStatus) => {
    if (!order) return Promise.resolve()
    return run(() => to === "cancelled" ? adminApi(`admin/orders/${order.id}/cancel`, { method: "POST" }) : to === "refunded" ? adminApi(`admin/orders/${order.id}/refund`, { method: "POST" }) : adminApi(`admin/orders/${order.id}/advance`, { method: "POST", body: { to } }))
  }
  const addNote = (text: string) => order && run(() => adminApi(`admin/orders/${order.id}/notes`, { method: "POST", body: { body: text } }))
  if (!order) return <div className="grid justify-items-center gap-3 rounded-2xl border bg-card p-12 text-center"><p className="font-semibold">Order not found</p><Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">Back to orders</Link></div>

  const subtotal = order.lines.reduce((t, l) => t + l.pricePaise * l.quantity, 0)
  const gstTotal = order.lines.reduce((t, l) => t + gstFromInclusive(l.pricePaise * l.quantity, l.gstPercent), 0)
  const next = perms.fulfil ? NEXT_STEP[order.status] : undefined
  const canCancel = perms.cancel && (order.status === "pending" || order.status === "paid" || order.status === "packed")
  const canRefund = perms.refund && order.status === "delivered"

  return (
    <>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}
      <Link href="/admin/orders" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /> All orders</Link>
      <PageHeader title={`Order ${order.id}`} description={`Placed ${fmtDateTime(order.placed)} by ${order.customerName}`}>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <Button variant="outline" onClick={() => window.print()}><Printer aria-hidden="true" /> Print</Button>
          {canRefund && <Button variant="outline" onClick={() => setConfirm("refund")}><Undo2 aria-hidden="true" /> Refund</Button>}
          {canCancel && <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirm("cancel")}><XCircle aria-hidden="true" /> Cancel order</Button>}
          {next && <Button disabled={busy} onClick={() => void setStatus(next.to)}><Check aria-hidden="true" /> {next.label}</Button>}
        </div>
      </PageHeader>
      {order.status === "pending" && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">Waiting for Razorpay to confirm payment. An order only moves to Paid when the signed confirmation arrives, never by hand.</p>}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-6">
          <section aria-labelledby="items-h" className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <h2 id="items-h" className="px-5 py-4 font-semibold">Items</h2>
            <div className="overflow-x-auto"><table className="w-full min-w-[32rem] text-left text-sm">
              <thead><tr className="border-y bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">Product</th><th className="px-3 text-right font-medium">Price</th><th className="px-3 text-right font-medium">Qty</th><th className="px-3 text-right font-medium">GST</th><th className="px-5 text-right font-medium">Line total</th></tr></thead>
              <tbody>{order.lines.map((l) => (
                <tr key={l.productId} className="border-b last:border-0"><td className="px-5 py-3 font-medium">{l.title}</td><td className="price px-3 text-right">{money(l.pricePaise)}</td><td className="price px-3 text-right">{l.quantity}</td><td className="price px-3 text-right text-muted-foreground">{l.gstPercent}%</td><td className="price px-5 text-right font-medium">{money(l.pricePaise * l.quantity)}</td></tr>))}</tbody>
            </table></div>
            <dl className="price ml-auto grid max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 p-5 text-sm">
              <dt className="text-muted-foreground">Subtotal</dt><dd className="text-right">{money(subtotal)}</dd>
              {order.discountPaise > 0 && <><dt className="text-emerald-700">Discount</dt><dd className="text-right text-emerald-700">−{money(order.discountPaise)}</dd></>}
              <dt className="text-muted-foreground">Delivery</dt><dd className="text-right">{order.shippingPaise === 0 ? "Free" : money(order.shippingPaise)}</dd>
              <dt className="border-t pt-2 font-semibold">Total</dt><dd className="border-t pt-2 text-right text-base font-bold">{money(orderTotal(order))}</dd>
              <dt className="text-xs text-muted-foreground">GST included</dt><dd className="text-right text-xs text-muted-foreground">{money(gstTotal)}</dd>
            </dl>
          </section>
          <section aria-labelledby="tl-h" className="rounded-2xl border bg-card p-5 shadow-xs">
            <h2 id="tl-h" className="mb-4 font-semibold">Timeline</h2>
            <ol className="relative grid gap-5 border-l pl-6">{[...order.timeline].reverse().map((t, i) => (
              <li key={i} className="relative text-sm"><span aria-hidden="true" className={`absolute -left-[2.05rem] top-0.5 grid size-5 place-items-center rounded-full ring-4 ring-card ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i === 0 ? <CircleDot className="size-3" /> : <Check className="size-3" />}</span>
                <p className="font-medium">{t.note ?? orderStatusMeta[t.status].label}</p><p className="text-xs text-muted-foreground">{t.by} · {fmtDateTime(t.at)}</p></li>))}</ol>
          </section>
        </div>
        <aside className="grid min-w-0 content-start gap-6">
          <section aria-labelledby="cust-h" className="rounded-2xl border bg-card p-5 shadow-xs">
            <h2 id="cust-h" className="mb-3 font-semibold">Customer</h2>
            <div className="mb-3 flex items-center gap-3"><span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{order.customerName[0]}</span><div><p className="font-medium">{order.customerName}</p><Link href="/admin/customers" className="text-xs text-primary hover:underline">View customer</Link></div></div>
            <ul className="grid gap-2 text-sm text-muted-foreground"><li className="flex items-center gap-2"><Mail className="size-4" aria-hidden="true" />{order.email}</li><li className="flex items-center gap-2"><Phone className="size-4" aria-hidden="true" />{order.phone}</li>
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><address className="not-italic">{order.addressLine}<br />{order.city} {order.pincode}</address></li></ul>
          </section>
          <section aria-labelledby="pay-h" className="rounded-2xl border bg-card p-5 shadow-xs text-sm">
            <h2 id="pay-h" className="mb-3 font-semibold">Payment</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2"><dt className="text-muted-foreground">Method</dt><dd className="text-right">{order.paymentMethod}</dd><dt className="text-muted-foreground">Provider</dt><dd className="text-right">Razorpay</dd><dt className="text-muted-foreground">Payment ID</dt><dd className="break-all text-right font-mono text-xs">{order.paymentId}</dd></dl>
          </section>
          <section aria-labelledby="note-h" className="rounded-2xl border bg-card p-5 shadow-xs">
            <h2 id="note-h" className="mb-3 flex items-center gap-2 font-semibold"><StickyNote className="size-4" aria-hidden="true" /> Internal notes</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (note.trim() && !busy) { void addNote(note.trim()); setNote("") } }} className="grid gap-2">
              <label htmlFor="note" className="sr-only">Add a note</label><textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Visible to staff only" className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" />
              <div><Button type="submit" size="sm" disabled={!note.trim() || busy}>Add note</Button></div>
            </form>
            <ul className="mt-3 grid gap-2">{order.notes.map((n, i) => <li key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">{n}</li>)}</ul>
          </section>
        </aside>
      </div>
      <ConfirmDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)} destructive title={confirm === "refund" ? `Refund order ${order.id}?` : `Cancel order ${order.id}?`}
        description={confirm === "refund" ? `${money(orderTotal(order))} goes back to ${order.customerName} on ${order.paymentMethod}. This records the refund on the order. Send the money back from the payment provider (not connected yet).` : `${order.customerName}'s order of ${money(orderTotal(order))} will be cancelled and any reserved stock released.`}
        confirmLabel={confirm === "refund" ? "Issue refund" : "Cancel order"} onConfirm={() => void setStatus(confirm === "refund" ? "refunded" : "cancelled")} />
    </>
  )
}
