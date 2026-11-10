import type { Product } from "@/features/catalog/demo"
import { ProductCard } from "./product-card"

/** Scrolls sideways on small screens, becomes a five-column grid on wide ones. */
export function ProductRow({ products, label }: { products: Product[]; label: string }) {
  return (
    <div role="region" aria-label={label} tabIndex={0}
      className="grid auto-cols-[10.5rem] grid-flow-col gap-3 overflow-x-auto pb-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:auto-cols-[12rem] xl:auto-cols-fr xl:grid-cols-5 xl:grid-flow-row xl:overflow-visible">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
