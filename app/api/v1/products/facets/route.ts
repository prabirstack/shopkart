import { ok, route } from "@/lib/api/http"
import { productQuery } from "@/lib/api/schemas"
import { facetCounts } from "@/lib/db/queries"

export const GET = route(async ({ query }) => {
  const q = query(productQuery)
  return ok(await facetCounts({ q: q.q, category: q.category, brands: q.brand, minPaise: q.min, maxPaise: q.max, inStock: q.inStock, rating: q.rating, discount: q.discount }))
}, { cache: "public, s-maxage=60, stale-while-revalidate=300" })
