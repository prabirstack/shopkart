import Link from "next/link"
import { ChevronRight, Ellipsis } from "lucide-react"
import { categories } from "@/features/catalog/demo"

const railSlugs = ["electronics", "mobiles", "fashion", "home-living", "kitchen-dining", "beauty", "sports", "books", "toys", "automotive"]

export function CategoryRail() {
  const items = railSlugs.map((s) => categories.find((c) => c.slug === s)!)
  return (
    <nav aria-label="Shop by category" className="hidden rounded-xl border bg-card py-2 shadow-sm lg:block">
      <ul>
        {items.map(({ slug, name, icon: Icon }) => (
          <li key={slug}>
            <Link href={`/categories/${slug}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted hover:text-primary">
              <span className="flex items-center gap-3"><Icon className="size-4 text-muted-foreground" aria-hidden="true" />{name}</span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
        <li>
          <Link href="/categories" className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted hover:text-primary">
            <span className="flex items-center gap-3"><Ellipsis className="size-4 text-muted-foreground" aria-hidden="true" />More Categories</span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
