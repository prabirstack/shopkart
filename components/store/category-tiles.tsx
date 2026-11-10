import Link from "next/link"
import { categories } from "@/features/catalog/demo"

const tileSlugs = ["mobiles", "laptops", "fashion", "home-living", "kitchen-dining", "beauty", "sports", "toys", "books"]

/** Row of small pastel tiles under the hero. Scrolls inside its own labelled region on narrow screens. */
export function CategoryTiles() {
  return (
    <nav aria-label="Popular categories">
      <ul className="grid auto-cols-[6.5rem] grid-flow-col gap-3 overflow-x-auto pb-2 lg:auto-cols-fr lg:grid-flow-row lg:grid-cols-9 lg:overflow-visible">
        {tileSlugs.map((slug) => {
          const c = categories.find((x) => x.slug === slug)!
          return (
            <li key={slug}>
              <Link href={`/categories/${slug}`} className={`flex h-full flex-col items-center justify-between gap-2 rounded-xl p-3 text-center text-xs font-medium transition-shadow hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 ${c.tint}`}>
                <c.icon className={`size-10 ${c.iconColor}`} strokeWidth={1.4} aria-hidden="true" />
                {c.short}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
