import Link from "next/link"
import { ProductCard } from "@/components/store/product-card"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { PageBanner } from "@/components/store/page-banner"
import type { Product } from "@/features/catalog/demo"

export function ProductListPage({ title, intro, products, moreHref = "/products", moreLabel = "Browse the full shop" }: {
  title: string; intro: string; products: Product[]; moreHref?: string; moreLabel?: string
}) {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-5 py-6">
      <StoreBreadcrumbs trail={[{ label: title }]} />
      <PageBanner title={title} intro={intro} />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
      </ul>
      <p className="text-center"><Link href={moreHref} className="text-sm font-medium text-primary hover:underline">{moreLabel}</Link></p>
    </main>
  )
}
