import { getProductReviews } from "@/features/reviews/data"
import type { Product } from "@/features/catalog/types"
import { ReviewsPanel } from "./reviews-panel"

/** Approved reviews and the star breakdown for a product, read from the database (cached, refreshed on approval). */
export async function ReviewsSection({ product }: { product: Pick<Product, "id" | "slug" | "title"> }) {
  const data = await getProductReviews(product.id)
  return <ReviewsPanel productId={product.id} slug={product.slug} title={product.title} data={data} />
}
