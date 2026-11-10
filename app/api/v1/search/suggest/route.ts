import { z } from "zod"

import { ok, route } from "@/lib/api/http"
import { suggestSearch } from "@/lib/db/queries"
import { toProduct } from "@/features/catalog/map"

const query = z.object({ q: z.string().trim().max(80) })

/** Instant suggestions for the header search box: products plus matching categories and brands. */
export const GET = route(async ({ query: parse }) => {
  const s = await suggestSearch(parse(query).q, 5)
  return ok({ products: s.products.map(toProduct), categories: s.categories, brands: s.brands })
}, { limit: { max: 60, windowSec: 60 }, cache: "public, s-maxage=30, stale-while-revalidate=60" })
