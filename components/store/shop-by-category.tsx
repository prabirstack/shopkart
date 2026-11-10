import Link from "next/link"
import { SectionHeader } from "./section-header"
import { categories } from "@/features/catalog/demo"

const slugs = ["electronics", "fashion", "home-living", "kitchen-dining", "beauty", "fitness", "automotive", "gaming"]

export function ShopByCategory() {
  return (
    <section aria-labelledby="shop-category-heading">
      <SectionHeader id="shop-category-heading" title="Shop by Category" href="/categories" linkLabel="View All Categories" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {slugs.map((slug) => {
          const c = categories.find((x) => x.slug === slug)!
          return (
            <li key={slug}>
              <Link href={`/categories/${slug}`} className={`flex h-full min-h-28 flex-col items-center justify-between gap-2 rounded-xl p-3 text-center text-sm font-medium transition-shadow hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 ${c.tint}`}>
                <c.icon className={`size-14 ${c.iconColor}`} strokeWidth={1.2} aria-hidden="true" />
                {c.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
