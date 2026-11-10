import { ok, route } from "@/lib/api/http"
import { cancelReturn } from "@/lib/db/queries"

/** A customer takes back their own return request, while we haven't acted on it yet. */
export const POST = route<{ number: string }>(async ({ params, user }) => ok(await cancelReturn({ returnNumber: params.number, userId: user().userId })), { limit: { max: 10, windowSec: 60 } })
