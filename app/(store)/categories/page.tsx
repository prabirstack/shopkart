import type { Metadata } from "next"
import Link from "next/link"
import { PageBanner } from "@/components/store/page-banner"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
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
              <Link href={`/products?category=${c.slug}`} className={`flex h-full min-h-40 flex-col items-center justify-between gap-3 rounded-xl p-4 text-center transition-shadow hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 ${c.tint}`}>
                <c.icon className={`size-14 ${c.iconColor}`} strokeWidth={1.2} aria-hidden="true" />
                <span><span className="block font-semibold">{c.name}</span><span className="text-xs text-muted-foreground">{count} {count === 1 ? "product" : "products"}</span></span>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
