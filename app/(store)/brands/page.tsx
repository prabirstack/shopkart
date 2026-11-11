import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { brandLogos } from "@/features/catalog/brand-logos"
import { PageBanner } from "@/components/store/page-banner"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { getBrands } from "@/features/catalog/data"

export const metadata: Metadata = { title: "Brands", description: "Shop top brands on ShopKart including Samsung, Apple, Nike, Adidas, Philips and more.", alternates: { canonical: "/brands" } }

export default async function BrandsPage() {
  const brands = (await getBrands()).filter((b) => b.count > 0)
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-4 py-6">
      <StoreBreadcrumbs trail={[{ label: "Brands" }]} />
      <PageBanner title="Shop by brand" intro="Brands you know and trust." />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {brands.map(({ name: b, count }) => (
          <li key={b}>
            <Link href={`/products?brand=${encodeURIComponent(b)}`} className="grid h-24 place-items-center rounded-xl border bg-card text-center hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span>{brandLogos[b] ? <span className="relative mx-auto mb-2 block h-8 w-28"><Image src={`/images/brands/${brandLogos[b]}.webp`} alt={b} fill sizes="112px" className="object-contain" /></span> : <span className="block font-bold tracking-wide">{b}</span>}<span className="text-xs text-muted-foreground">{count} {count === 1 ? "product" : "products"}</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
