import type { Metadata } from "next"
import { Countdown } from "@/components/store/countdown"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { ProductCard } from "@/components/store/product-card"
import { catalog, discountPercent } from "@/features/catalog/demo"
import { DEALS_END_AT } from "@/features/promotions/demo"

export const metadata: Metadata = { title: "Today's deals", description: "Today's biggest discounts on electronics, fashion and home essentials. Limited-time offers with free delivery above ₹699.", alternates: { canonical: "/deals" } }

export default function DealsPage() {
  const deals = catalog.filter((p) => discountPercent(p) > 0).sort((a, b) => discountPercent(b) - discountPercent(a))
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-4 py-6">
      <StoreBreadcrumbs trail={[{ label: "Today's deals" }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="store-title !text-3xl">Today&apos;s deals</h1>
        <Countdown endsAt={DEALS_END_AT} />
      </div>
      <p className="text-sm text-muted-foreground">{deals.length} products on offer, biggest discounts first.</p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {deals.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
      </ul>
    </main>
  )
}
