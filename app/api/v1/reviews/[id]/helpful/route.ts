import { ApiError, ok, route } from "@/lib/api/http"
import { uuid } from "@/lib/api/schemas"
import { DomainError, toggleHelpfulVote } from "@/lib/db/queries"

/** Toggles the signed-in customer's "helpful" vote on a review. Returns the new state and the exact count. */
export const POST = route<{ id: string }>(async ({ params, user }) => {
  const me = user()
  try {
    return ok(await toggleHelpfulVote(uuid.parse(params.id), me.userId))
  } catch (e) {
    if (e instanceof DomainError && e.code === "OWN_REVIEW") throw new ApiError(403, "OWN_REVIEW", e.message)
    throw e
  }
}, { limit: { max: 30, windowSec: 60 }, invalidates: ["catalog"] })
