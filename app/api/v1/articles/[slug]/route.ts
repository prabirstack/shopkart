import { ApiError, ok, route } from "@/lib/api/http"
import { getPublishedArticle } from "@/lib/db/queries"

export const GET = route<{ slug: string }>(async ({ params }) => {
  const a = await getPublishedArticle(params.slug)
  if (!a) throw new ApiError(404, "NOT_FOUND", "Article not found.")
  return ok(a)
}, { cache: "public, s-maxage=120, stale-while-revalidate=600" })
