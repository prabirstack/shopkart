import { ok, route } from "@/lib/api/http"
import { productQuery } from "@/lib/api/schemas"
import { searchProducts } from "@/lib/db/queries"

const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300"

export const GET = route(async ({ query }) => {
  const q = query(productQuery)
  return ok(await searchProducts({ q: q.q, category: q.category, brands: q.brand, minPaise: q.min, maxPaise: q.max, inStock: q.inStock, rating: q.rating, discount: q.discount, sort: q.sort, page: q.page, pageSize: q.pageSize }))
}, { cache: PUBLIC_CACHE })
