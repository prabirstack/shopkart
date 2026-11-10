import { ok, route } from "@/lib/api/http"
import { listPublishedArticles } from "@/lib/db/queries"

/** Listing omits the body so the response stays small. */
export const GET = route(async () => ok((await listPublishedArticles()).map((a) => ({ ...a, doc: undefined }))), { cache: "public, s-maxage=120, stale-while-revalidate=600" })
