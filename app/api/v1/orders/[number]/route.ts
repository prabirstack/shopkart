import { ApiError, ok, route } from "@/lib/api/http"
import { getOrderForUser } from "@/lib/db/queries"

/** Ownership is enforced inside the query: someone else's order number is a 404, not a 403, so it can't be probed. */
export const GET = route<{ number: string }>(async ({ params, user }) => {
  const order = await getOrderForUser(params.number, user().userId)
  if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found.")
  return ok(order)
})
