import { ok, route } from "@/lib/api/http"
import { listBrands } from "@/lib/db/queries"

export const GET = route(async () => ok(await listBrands()), { cache: "public, s-maxage=300, stale-while-revalidate=600" })
