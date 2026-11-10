import Link from "next/link"
import { StatusBadge } from "@/components/admin/status-badge"
import { CopyCodeButton } from "@/components/account/copy-code-button"
import { buttonVariants } from "@/components/ui/button"
import { couponRules } from "@/features/coupons/demo"
import { formatMoney } from "@/lib/money"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })
const tone = { active: "good", expired: "muted", used: "muted" } as const

export default function AccountCouponsPage() {
  const groups = [
    { title: "Available", list: couponRules.filter((c) => c.status === "active") },
    { title: "Expired or used", list: couponRules.filter((c) => c.status !== "active") },
  ]
  return (
    <>
      <h1 className="store-title !text-3xl">My coupons</h1>
      {groups.map(({ title, list }) => (
        <section key={title} aria-labelledby={`g-${title}`} className="grid gap-3">
          <h2 id={`g-${title}`} className="section-title">{title}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {list.map((c) => {
              const live = c.status === "active"
              return (
                <li key={c.code} className={`relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-5 ${live ? "" : "opacity-70"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="price text-2xl font-extrabold text-primary">{c.kind === "percent" ? `${c.value}% OFF` : `${rupees(c.value)} OFF`}</p>
                      <p className="text-sm">{c.description}</p>
                    </div>
                    <StatusBadge tone={tone[c.status]}>{c.status[0].toUpperCase() + c.status.slice(1)}</StatusBadge>
                  </div>
                  <p className="rounded-md border border-dashed px-3 py-2 text-center font-mono text-sm font-semibold tracking-wider">{c.code}</p>
                  <ul className="grid gap-0.5 text-xs text-muted-foreground"><li>Minimum order {rupees(c.minOrderPaise)}</li><li>{live ? "Valid till" : "Ended"} {c.expires}</li></ul>
                  <div className="flex gap-2"><CopyCodeButton code={c.code} disabled={!live} />{live && <Link href="/cart" className={buttonVariants({ size: "sm" })}>Use in cart</Link>}</div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}
