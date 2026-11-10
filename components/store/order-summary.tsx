import { formatMoney } from "@/lib/money"
import type { Quote } from "@/lib/pricing"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

export function SummaryRows({ q, couponCode }: { q: Quote; couponCode?: string | null }) {
  return (
    <dl className="price grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Subtotal</dt><dd className="text-right">{rupees(q.subtotalPaise)}</dd>
      {q.discountPaise > 0 && (<><dt className="text-emerald-700">Discount{couponCode ? ` (${couponCode})` : ""}</dt><dd className="text-right text-emerald-700">−{rupees(q.discountPaise)}</dd></>)}
      <dt className="text-muted-foreground">Delivery</dt><dd className="text-right">{q.shippingPaise === 0 ? <span className="text-emerald-700">Free</span> : rupees(q.shippingPaise)}</dd>
      <dt className="border-t pt-3 text-base font-semibold">Total</dt><dd className="border-t pt-3 text-right text-lg font-bold">{rupees(q.totalPaise)}</dd>
      <dt className="text-xs text-muted-foreground">Includes GST</dt><dd className="text-right text-xs text-muted-foreground">{rupees(q.gstIncludedPaise)}</dd>
    </dl>
  )
}
