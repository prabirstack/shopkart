import { Tag } from "lucide-react"
import { CopyCodeButton } from "@/components/account/copy-code-button"
import { couponRules } from "@/features/coupons/demo"
import { formatMoney } from "@/lib/money"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

export function OffersBox() {
  const live = couponRules.filter((c) => c.status === "active")
  return (
    <section aria-labelledby="offers" className="grid gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <h2 id="offers" className="flex items-center gap-2 text-sm font-semibold"><Tag className="size-4 text-primary" aria-hidden="true" /> Available offers</h2>
      <ul className="grid gap-2">
        {live.map((c) => (
          <li key={c.code} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span><strong className="font-mono">{c.code}</strong> <span className="text-muted-foreground">{c.kind === "percent" ? `${c.value}% off` : `${rupees(c.value)} off`} on orders above {rupees(c.minOrderPaise)}</span></span>
            <CopyCodeButton code={c.code} />
          </li>
        ))}
      </ul>
    </section>
  )
}
