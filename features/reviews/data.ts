import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { CACHE_TAGS } from "@/lib/cache"
import { listApprovedReviews, reviewSummary } from "@/lib/db/queries"

/** A public review as the product page shows it. Plain JSON, so it can go to client components. */
export type ReviewView = { id: string; name: string; rating: number; title: string; body: string; date: string; verified: boolean; helpful: number }
export type ReviewsData = { count: number; average: number | null; distribution: Record<number, number>; items: ReviewView[] }

/** Approved reviews only, newest first, plus the star breakdown. Refreshed whenever a review is approved or voted on. */
export async function getProductReviews(productId: string): Promise<ReviewsData> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CACHE_TAGS.catalog)
  const [summary, list] = await Promise.all([reviewSummary(productId), listApprovedReviews(productId, { limit: 50 })])
  return {
    ...summary,
    items: list.map((r) => ({ id: r.id, name: r.authorName, rating: r.rating, title: r.title, body: r.body, date: r.createdAt.toISOString().slice(0, 10), verified: r.verifiedPurchase, helpful: r.helpfulCount })),
  }
}
