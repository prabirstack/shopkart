import type { Metadata } from "next"
import Link from "next/link"
import { PageBanner } from "@/components/store/page-banner"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { CategoryArt } from "@/components/store/category-art"
import { catalog, categories } from "@/features/catalog/demo"

export const metadata: Metadata = { title: "All categories", description: "Explore every ShopKart category: electronics, fashion, home, kitchen, beauty, sports and more.", alternates: { canonical: "/categories" } }

export default function CategoriesPage() {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-4 py-6">
      <StoreBreadcrumbs trail={[{ label: "All categories" }]} />
      <PageBanner title="All categories" intro="Everything we sell, grouped the way you shop." />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => {
          const count = catalog.filter((p) => p.category === c.slug).length
          return (
            <li key={c.slug}>
              <Link href={`/products?category=${c.slug}`} className={`group/tile flex h-full min-h-40 flex-col items-center justify-between gap-3 rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 ${c.tint}`}>
                <span className="relative block h-20 w-full overflow-hidden rounded-xl transition-transform duration-300 group-hover/tile:scale-110"><CategoryArt slug={c.slug} name={c.name} icon={c.icon} iconColor={c.iconColor} sizes="240px" iconClassName="size-14" /></span>
                <span><span className="block font-semibold">{c.name}</span><span className="text-xs text-muted-foreground">{count} {count === 1 ? "product" : "products"}</span></span>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
