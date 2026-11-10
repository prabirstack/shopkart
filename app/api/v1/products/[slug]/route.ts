import { ApiError, ok, route } from "@/lib/api/http"
import { getProductBySlug } from "@/lib/db/queries"

export const GET = route<{ slug: string }>(async ({ params }) => {
  const product = await getProductBySlug(params.slug)
  if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found.")
  return ok(product)
}, { cache: "public, s-maxage=60, stale-while-revalidate=300" })
