import Link from "next/link"
import { Suspense } from "react"
import { AccountTitle } from "@/components/account/account-title"
import { StatusBadge } from "@/components/admin/status-badge"
import { CopyCodeButton } from "@/components/account/copy-code-button"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/features/account/orders"
import { requireUser } from "@/features/account/session"
import { listActiveCoupons, listCouponUsesForUser } from "@/lib/db/queries"
import { formatMoney } from "@/lib/money"

export const instant = false

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })
type Rule = { kind: "percent" | "flat"; value: number; minOrderPaise: number }
const headline = (c: Rule) => (c.kind === "percent" ? `${c.value}% OFF` : `${rupees(c.value)} OFF`)
const describe = (c: Rule) => (c.kind === "percent" ? `${c.value}% off your order` : c.minOrderPaise > 0 ? `${rupees(c.value)} off orders above ${rupees(c.minOrderPaise)}` : `${rupees(c.value)} off your order`)
const minimum = (c: Rule) => (c.minOrderPaise > 0 ? `Minimum order ${rupees(c.minOrderPaise)}` : "No minimum order")

async function Coupons() {
  const user = await requireUser("/account/coupons")
  const [active, used] = await Promise.all([listActiveCoupons(), listCouponUsesForUser(user.id)])
  // A coupon works once per customer, so ones this customer already used are listed under "Used" instead.
  const usedCodes = new Set(used.map((u) => u.code))
  const available = active.filter((c) => !usedCodes.has(c.code))
  return (
    <>
      <section aria-labelledby="g-available" className="grid gap-3">
        <h2 id="g-available" className="section-title">Available</h2>
        {available.length === 0 ? <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">No coupons are running right now. Check back soon.</p> : (
          <ul className="grid gap-3 md:grid-cols-2">
            {available.map((c) => (
              <li key={c.code} className="relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="price text-2xl font-extrabold text-primary">{headline(c)}</p><p className="text-sm">{describe(c)}</p></div>
                  <StatusBadge tone="good">Active</StatusBadge>
                </div>
                <p className="rounded-md border border-dashed px-3 py-2 text-center font-mono text-sm font-semibold tracking-wider">{c.code}</p>
                <ul className="grid gap-0.5 text-xs text-muted-foreground"><li>{minimum(c)}</li><li>Valid till {formatDate(c.expiresAt)}</li></ul>
                <div className="flex gap-2"><CopyCodeButton code={c.code} /><Link href="/cart" className={buttonVariants({ size: "sm" })}>Use in cart</Link></div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {used.length > 0 && (
        <section aria-labelledby="g-used" className="grid gap-3">
          <h2 id="g-used" className="section-title">Used</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {used.map((c) => (
              <li key={c.code} className="relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-5 opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="price text-2xl font-extrabold text-primary">{headline(c)}</p><p className="text-sm">{describe(c)}</p></div>
                  <StatusBadge tone="muted">Used</StatusBadge>
                </div>
                <p className="rounded-md border border-dashed px-3 py-2 text-center font-mono text-sm font-semibold tracking-wider">{c.code}</p>
                <ul className="grid gap-0.5 text-xs text-muted-foreground"><li>You saved {rupees(c.discountPaise)} on <Link href={`/account/orders/${c.orderNumber}`} className="font-mono text-primary hover:underline">{c.orderNumber}</Link></li><li>Used on {formatDate(c.redeemedAt)}</li></ul>
                <div className="flex gap-2"><CopyCodeButton code={c.code} disabled /></div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

export default function AccountCouponsPage() {
  return (
    <>
      <AccountTitle title="My coupons" description="Codes you can use now, and ones you have already used." />
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}><Coupons /></Suspense>
    </>
  )
}
