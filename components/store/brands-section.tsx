import Link from "next/link"
import { SectionHeader } from "./section-header"
import { brands } from "@/features/catalog/demo"

export function BrandsSection() {
  return (
    <section aria-labelledby="brands-heading">
      <SectionHeader id="brands-heading" title="Top Brands on ShopKart" href="/brands" linkLabel="View All Brands" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {brands.map((brand) => (
          <li key={brand}>
            <Link href={`/brands/${brand.toLowerCase()}`} className="grid h-14 place-items-center rounded-xl border bg-card text-sm font-bold tracking-wide hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
              {brand}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
