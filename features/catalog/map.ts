import type { ProductDTO } from "@/lib/db/queries/types"
import { formatCount, type Product } from "./types"

/** Database product -> the storefront's plain `Product`. Pure, so the API route and server loaders share it. */
export function toProduct(d: ProductDTO): Product {
  return {
    id: d.id, slug: d.slug, title: d.title, category: d.category.slug, brand: d.brand.name, pricePaise: d.pricePaise,
    comparePaise: d.comparePaise ?? undefined, badge: d.badge ?? undefined, rating: d.rating ?? undefined, ratingCount: d.ratingCount,
    reviews: d.ratingCount > 0 ? formatCount(d.ratingCount) : undefined, stock: d.available, gstPercent: d.gstPercent, description: d.description,
    images: d.images.length ? d.images.map((i) => ({ url: i.url, alt: i.alt })) : undefined,
  }
}
