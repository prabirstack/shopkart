import type { Metadata } from "next"
import Link from "next/link"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { brands, catalog } from "@/features/catalog/demo"

export const metadata: Metadata = { title: "Brands", description: "Shop top brands on ShopKart including Samsung, Apple, Nike, Adidas, Philips and more.", alternates: { canonical: "/brands" } }

export default function BrandsPage() {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-4 py-6">
      <StoreBreadcrumbs trail={[{ label: "Brands" }]} />
      <h1 className="store-title !text-3xl">Shop by brand</h1>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {brands.map((b) => (
          <li key={b}>
            <Link href={`/products?brand=${encodeURIComponent(b)}`} className="grid h-24 place-items-center rounded-xl border bg-card text-center hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span><span className="block font-bold tracking-wide">{b}</span><span className="text-xs text-muted-foreground">{catalog.filter((p) => p.brand === b).length} products</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
