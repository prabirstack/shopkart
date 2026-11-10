import { ApiError, ok, route } from "@/lib/api/http"
import { unsubscribeBody } from "@/lib/api/schemas"
import { unsubscribeByToken } from "@/lib/db/queries"

/** One-click unsubscribe. The token in the link is the proof; repeating it is harmless. A POST, so link scanners can't unsubscribe people by prefetching. */
export const POST = route(async ({ json }) => {
  if (!(await unsubscribeByToken((await json(unsubscribeBody)).token))) throw new ApiError(404, "NOT_FOUND", "This unsubscribe link isn't valid.")
  return ok({ unsubscribed: true })
}, { limit: { max: 20, windowSec: 600 } })
