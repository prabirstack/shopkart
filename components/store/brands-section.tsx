import Link from "next/link"
import { SectionHeader } from "./section-header"
import { getBrands } from "@/features/catalog/data"

export async function BrandsSection() {
  const brands = (await getBrands()).filter((b) => b.count > 0).slice(0, 8)
  return (
    <section aria-labelledby="brands-heading">
      <SectionHeader id="brands-heading" title="Top Brands on ShopKart" href="/brands" linkLabel="View All Brands" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {brands.map(({ name: brand }) => (
          <li key={brand}>
            <Link href={`/products?brand=${encodeURIComponent(brand)}`} className="grid h-14 place-items-center rounded-xl border bg-card text-sm font-bold tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
              {brand}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
