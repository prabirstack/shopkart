import { ok, route } from "@/lib/api/http"
import { listCategories } from "@/lib/db/queries"

export const GET = route(async () => ok(await listCategories()), { cache: "public, s-maxage=300, stale-while-revalidate=600" })
