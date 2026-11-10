"use client"
import { useState } from "react"
import { Check, PackageSearch } from "lucide-react"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"

const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"

type Tracked = {
  number: string; firstName: string; placedAt: string
  status: "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded"
  events: { status: string; at: string }[]
  items: { title: string; quantity: number }[]
}

const STEPS = [
  { status: "pending", label: "Order placed" }, { status: "paid", label: "Payment received" }, { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" }, { status: "delivered", label: "Delivered" },
] as const
const TONE = { pending: "warn", paid: "info", packed: "info", shipped: "info", delivered: "good", cancelled: "muted", refunded: "muted" } as const
const LABEL = { pending: "Awaiting payment", paid: "Paid", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded" } as const
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

/** Looks an order up by number and email. The server gives one answer for "no such order" and "wrong email". */
export function TrackForm() {
  const [result, setResult] = useState<Tracked | "none" | { message: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const lookup = async (number: string, email: string) => {
    setBusy(true); setResult(null)
    try {
      const res = await fetch("/api/v1/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number, email }) })
      const body = await res.json().catch(() => null)
      if (res.ok) setResult(body.data as Tracked)
      else if (res.status === 429) setResult({ message: "Too many tries. Please wait a minute and try again." })
      else if (res.status === 404 || res.status === 422) setResult("none")
      else setResult({ message: "We couldn't look that up right now. Please try again." })
    } catch { setResult({ message: "Couldn't reach the server. Check your connection and try again." }) }
    finally { setBusy(false) }
  }

  const reached = (t: Tracked) => new Map(t.events.map((e) => [e.status, e.at]))
  return (
    <div className="grid gap-5">
      <form onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        void lookup(String(data.get("order")).trim().toUpperCase(), String(data.get("email")).trim().toLowerCase())
      }} className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <div className="grid gap-1.5"><label htmlFor="order" className="text-sm font-medium">Order number</label><input id="order" name="order" required placeholder="SK-10482" autoCapitalize="characters" className={input} /></div>
        <div className="grid gap-1.5"><label htmlFor="email" className="text-sm font-medium">Email used at checkout</label><input id="email" name="email" type="email" required autoComplete="email" className={input} /></div>
        <div className="sm:col-span-2"><Button type="submit" disabled={busy}><PackageSearch aria-hidden="true" /> {busy ? "Looking…" : "Track order"}</Button></div>
      </form>
      <div role="status" aria-live="polite">
        {result === "none" && <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">We couldn&apos;t find an order with those details. Check the order number and email in your confirmation message.</p>}
        {result && typeof result === "object" && "message" in result && <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{result.message}</p>}
        {result && typeof result === "object" && "number" in result && (() => {
          const at = reached(result)
          const stopped = result.status === "cancelled" || result.status === "refunded"
          return (
            <section aria-label={`Status of order ${result.number}`} className="grid gap-4 rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">Order <span className="font-mono">{result.number}</span></p>
                <StatusBadge tone={TONE[result.status]}>{LABEL[result.status]}</StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">Hi {result.firstName}, placed on {day(result.placedAt)}.</p>
              <ol className="grid gap-3 sm:grid-cols-5">
                {STEPS.map((step, i) => {
                  const when = step.status === "pending" ? result.placedAt : at.get(step.status)
                  const done = Boolean(when)
                  return (
                    <li key={step.status} className="flex items-center gap-3 sm:block">
                      <span className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>{done ? <Check className="size-4" aria-hidden="true" /> : i + 1}</span>
                      <span className={`text-sm sm:mt-2 sm:block ${done ? "font-semibold" : "text-muted-foreground"}`}>{step.label}<span className="sr-only">{done ? " (done)" : " (pending)"}</span>
                        {when && <span className="block text-xs font-normal text-muted-foreground">{day(when)}</span>}</span>
                    </li>
                  )
                })}
              </ol>
              {stopped && <p className="rounded-lg bg-muted p-3 text-sm">This order was {result.status}.{result.status === "cancelled" ? " If you paid, the money goes back to your original payment method." : ""}</p>}
              <div className="border-t pt-3">
                <h2 className="mb-1.5 text-sm font-semibold">Items</h2>
                <ul className="grid gap-1 text-sm text-muted-foreground">{result.items.map((it) => <li key={it.title}>{it.title} <span className="text-foreground">× {it.quantity}</span></li>)}</ul>
              </div>
            </section>
          )
        })()}
      </div>
    </div>
  )
}
