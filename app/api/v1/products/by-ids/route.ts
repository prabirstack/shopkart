import { z } from "zod"

import { ok, route } from "@/lib/api/http"
import { uuid } from "@/lib/api/schemas"
import { getProductsByIds } from "@/lib/db/queries"
import { toProduct } from "@/features/catalog/map"

const query = z.object({ ids: z.string().max(2000).transform((v) => [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))]).pipe(z.array(uuid).min(1).max(50)) })

/** Current price, availability and details for specific products: used by the cart, wishlist and compare list. Unknown ids are skipped. */
export const GET = route(async ({ query: parse }) => ok((await getProductsByIds(parse(query).ids)).map(toProduct)), { cache: "public, s-maxage=10, stale-while-revalidate=30" })
