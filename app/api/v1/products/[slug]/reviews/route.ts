import { ApiError, created, ok, route } from "@/lib/api/http"
import { paging, reviewBody } from "@/lib/api/schemas"
import { getProductBySlug, hasPurchased, listApprovedReviews, reviewSummary, submitReview } from "@/lib/db/queries"

async function productOr404(slug: string) {
  const product = await getProductBySlug(slug)
  if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found.")
  return product
}

/** Approved reviews only, plus the star breakdown. */
export const GET = route<{ slug: string }>(async ({ params, query }) => {
  const product = await productOr404(params.slug)
  const { page = 1, pageSize = 10 } = query(paging)
  const [items, summary] = await Promise.all([listApprovedReviews(product.id, { limit: pageSize, offset: (page - 1) * pageSize }), reviewSummary(product.id)])
  return ok({ summary, items, page, pageSize })
}, { cache: "public, s-maxage=60, stale-while-revalidate=300" })

/** Signed-in customers only. The review waits for moderation; "verified" is decided on the server, never by the client. */
export const POST = route<{ slug: string }>(async ({ params, json, user }) => {
  const me = user()
  const product = await productOr404(params.slug)
  const body = await json(reviewBody)
  const review = await submitReview({ ...body, productId: product.id, userId: me.userId, authorName: me.name, verifiedPurchase: await hasPurchased(me.userId, product.id) })
  return created({ ...review, status: "pending" })
}, { limit: { max: 10, windowSec: 600 } })
