import { ApiError, ok, route } from "@/lib/api/http"
import { getProductBySlug, relatedProducts } from "@/lib/db/queries"

export const GET = route<{ slug: string }>(async ({ params }) => {
  const product = await getProductBySlug(params.slug)
  if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found.")
  return ok(await relatedProducts(product.id, 5))
}, { cache: "public, s-maxage=300, stale-while-revalidate=600" })
