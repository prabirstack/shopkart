import type { Product } from "@/features/catalog/demo"
import { distributionFor, reviewsFor } from "@/features/reviews/demo"
import { ReviewsPanel } from "./reviews-panel"

/** Parses counts like "3.2K" into a number. */
const parseCount = (s?: string) => { const n = Number((s ?? "0").replace(/[^0-9.]/g, "")); return s?.includes("K") ? Math.round(n * 1000) : Math.round(n) }

/** Server wrapper: prepares sample reviews and rating figures, then hands them to the interactive panel. */
export function ReviewsSection({ product }: { product: Product }) {
  const avg = product.rating ?? 4.5
  return <ReviewsPanel productId={product.id} title={product.title} totalRatings={parseCount(product.reviews)} distribution={distributionFor(avg)} sample={reviewsFor(product.id, avg)} />
}
