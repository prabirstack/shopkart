import { z } from "zod"

import { ok, route } from "@/lib/api/http"
import { listActiveBanners } from "@/lib/db/queries"

const q = z.object({ slot: z.enum(["home_hero", "home_promo_grid", "category_banner", "cart_banner"]) })

export const GET = route(async ({ query }) => ok(await listActiveBanners(query(q).slot)), { cache: "public, s-maxage=60, stale-while-revalidate=300" })
