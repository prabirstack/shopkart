"use client"
import { useState } from "react"
import { Check, PackageSearch } from "lucide-react"
import { OrderStatusPill } from "@/components/account/status-pill"
import { Button } from "@/components/ui/button"
import { TIMELINE, demoUser, orders, progressFor, type AccountOrder } from "@/features/account/demo"

const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"

/** Demo lookup. A real one is a server action that rate-limits and never reveals whether an order exists. */
export function TrackForm() {
  const [result, setResult] = useState<AccountOrder | "none" | null>(null)
  return (
    <div className="grid gap-5">
      <form onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        const number = String(data.get("order")).trim().toUpperCase()
        const email = String(data.get("email")).trim().toLowerCase()
        const found = orders.find((o) => o.number === number)
        setResult(found && email === demoUser.email ? found : "none")
      }} className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <div className="grid gap-1.5"><label htmlFor="order" className="text-sm font-medium">Order number</label><input id="order" name="order" required placeholder="SK-10482" className={input} /></div>
        <div className="grid gap-1.5"><label htmlFor="email" className="text-sm font-medium">Email used at checkout</label><input id="email" name="email" type="email" required autoComplete="email" className={input} /></div>
        <div className="sm:col-span-2"><Button type="submit"><PackageSearch aria-hidden="true" /> Track order</Button></div>
        <p className="text-xs text-muted-foreground sm:col-span-2">Demo: try SK-10482 with aarav@example.com.</p>
      </form>
      <div role="status" aria-live="polite">
        {result === "none" && <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">We couldn&apos;t find an order with those details. Check the order number and email in your confirmation message.</p>}
        {result && result !== "none" && (
          <section aria-label={`Status of order ${result.number}`} className="grid gap-4 rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Order <span className="font-mono">{result.number}</span></p><OrderStatusPill status={result.status} /></div>
            <ol className="grid gap-3 sm:grid-cols-5">
              {TIMELINE.map((step, i) => { const done = i < progressFor(result.status); return (
                <li key={step} className="flex items-center gap-3 sm:block">
                  <span className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>{done ? <Check className="size-4" aria-hidden="true" /> : i + 1}</span>
                  <span className={`text-sm sm:mt-2 sm:block ${done ? "font-semibold" : "text-muted-foreground"}`}>{step}<span className="sr-only">{done ? " (done)" : " (pending)"}</span></span>
                </li>) })}
            </ol>
          </section>
        )}
      </div>
    </div>
  )
}
