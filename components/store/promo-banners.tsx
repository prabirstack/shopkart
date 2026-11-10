import Link from "next/link"
import { Gift, Headphones, Percent, Truck } from "lucide-react"
import { CopyCodeButton } from "@/components/account/copy-code-button"
import { formatMoney } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE } from "@/lib/store-config"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

/** Banner shown in the buy column, next to the price and add-to-cart controls. */
export function ProductPromoBanner() {
  return (
    <section aria-label="Offer" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-950 via-red-950 to-primary p-5 text-white">
      <Percent className="absolute -bottom-4 -right-2 size-28 opacity-20" strokeWidth={1} aria-hidden="true" />
      <div className="relative grid gap-2">
        <p className="w-fit rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold">New to ShopKart?</p>
        <p className="text-xl font-extrabold leading-tight">Get 10% off your order</p>
        <p className="text-sm text-white/80">Use code <strong className="font-mono">WELCOME10</strong> on orders above {rupees(49900)}.</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <CopyCodeButton code="WELCOME10" />
          <Link href="/deals" className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-xs font-semibold text-primary hover:bg-white/90">See today&apos;s deals</Link>
        </div>
      </div>
    </section>
  )
}

/** Sticky sidebar for the long details area, so the right edge is never empty. */
export function ProductAside() {
  return (
    <aside aria-label="Offers and help" className="grid content-start gap-4 lg:sticky lg:top-16">
      <Link href="/help/shipping" className="relative grid gap-1 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-200 p-5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <Truck className="absolute -bottom-3 -right-2 size-24 text-emerald-700 opacity-20" strokeWidth={1} aria-hidden="true" />
        <p className="relative text-xs font-semibold uppercase tracking-wide text-emerald-800">Free delivery</p>
        <p className="relative text-lg font-extrabold leading-tight text-emerald-950">On orders above {rupees(FREE_DELIVERY_ABOVE_PAISE)}</p>
        <p className="relative text-sm text-emerald-900">Fast, tracked and insured.</p>
      </Link>
      <Link href="/gift-cards" className="relative grid gap-1 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-orange-300 p-5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <Gift className="absolute -bottom-3 -right-2 size-24 text-orange-800 opacity-20" strokeWidth={1} aria-hidden="true" />
        <p className="relative text-xs font-semibold uppercase tracking-wide text-orange-900">Gift cards</p>
        <p className="relative text-lg font-extrabold leading-tight text-orange-950">Not sure what to pick?</p>
        <p className="relative text-sm text-orange-900">Let them choose. From ₹500.</p>
      </Link>
      <Link href="/help" className="flex items-center gap-4 rounded-2xl border bg-card p-5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Headphones className="size-5" aria-hidden="true" /></span>
        <span><span className="block font-semibold">Need help buying?</span><span className="text-sm text-muted-foreground">Our team replies within a working day.</span></span>
      </Link>
    </aside>
  )
}
