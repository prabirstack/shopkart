import { ok, route } from "@/lib/api/http"
import { getProductsByIds, listWishlist } from "@/lib/db/queries"

export const GET = route(async ({ user }) => ok(await getProductsByIds(await listWishlist(user().userId))))
