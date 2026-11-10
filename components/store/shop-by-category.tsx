import Link from "next/link"
import { SectionHeader } from "./section-header"
import { categories } from "@/features/catalog/demo"
import { CategoryArt } from "./category-art"

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
              <Link href={`/categories/${slug}`} className={`group/tile flex h-full min-h-28 flex-col items-center justify-between gap-2 rounded-xl p-3 text-center text-sm font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 ${c.tint}`}>
                <span className="relative block h-16 w-full overflow-hidden rounded-lg transition-transform duration-300 group-hover/tile:scale-110"><CategoryArt slug={c.slug} name={c.name} icon={c.icon} iconColor={c.iconColor} sizes="160px" iconClassName="size-14" /></span>
                {c.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
