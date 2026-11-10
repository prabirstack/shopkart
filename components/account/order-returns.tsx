import { CancelReturnButton } from "@/components/account/cancel-return-button"
import { ReturnStatusPill } from "@/components/account/return-status-pill"
import { RETURN_NEXT } from "@/features/account/returns"
import { formatDate } from "@/features/account/orders"
import type { CustomerReturnDTO } from "@/lib/db/queries/returns-customer"
import { formatMoney } from "@/lib/money"

const money = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

/** The returns a customer has asked for on one order, newest first. */
export function OrderReturns({ returns }: { returns: CustomerReturnDTO[] }) {
  if (returns.length === 0) return null
  return (
    <section aria-labelledby="returns" className="rounded-xl border bg-card p-5">
      <h2 id="returns" className="mb-3 font-semibold">Returns</h2>
      <ul className="divide-y">
        {returns.map((r) => (
          <li key={r.id} className="grid gap-2 py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold">{r.number}</span><ReturnStatusPill status={r.status} /></p>
              <p className="price text-sm font-semibold"><span className="sr-only">Refund amount </span>{money(r.refundPaise)}</p>
            </div>
            <ul aria-label={`Items in ${r.number}`} className="text-sm">{r.items.map((i) => <li key={i.orderItemId}>{i.title} <span className="text-muted-foreground">x {i.quantity}</span></li>)}</ul>
            <p className="text-xs text-muted-foreground">Requested {formatDate(r.requestedAt)} · Reason: {r.reason}{r.note ? ` · "${r.note}"` : ""}</p>
            <p className="text-sm text-muted-foreground">{RETURN_NEXT[r.status]}</p>
            {r.status === "requested" && <div><CancelReturnButton number={r.number} /></div>}
          </li>
        ))}
      </ul>
    </section>
  )
}
