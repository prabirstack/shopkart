import Link from "next/link"
import { ChevronRight, Ellipsis } from "lucide-react"
import { categoryIcon } from "@/features/catalog/category-meta"
import { getCategories } from "@/features/catalog/data"

export async function CategoryRail() {
  const all = await getCategories()
  const items = all
  return (
    <nav aria-label="Shop by category" className="hidden rounded-lg border bg-card py-2 shadow-sm lg:block">
      <ul className="flex h-full flex-col justify-between">
        {items.map(({ slug, name }) => {
          const Icon = categoryIcon(slug)
          return (
          <li key={slug}>
            <Link href={`/categories/${slug}`} className="flex items-center justify-between px-4 py-1.5 text-xs hover:bg-muted hover:text-primary">
              <span className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" aria-hidden="true" />{name}</span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
          )
        })}
        <li>
          <Link href="/categories" className="flex items-center justify-between px-4 py-1.5 text-xs hover:bg-muted hover:text-primary">
            <span className="flex items-center gap-2"><Ellipsis className="size-4 text-muted-foreground" aria-hidden="true" />More Categories</span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
