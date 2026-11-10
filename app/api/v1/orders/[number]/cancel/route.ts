import { ApiError, ok, route } from "@/lib/api/http"
import { cancelOrder, getOrderForUser } from "@/lib/db/queries"

/** Customers can cancel their own order until it is paid. After that, support cancels and refunds it. */
export const POST = route<{ number: string }>(async ({ params, user }) => {
  const me = user()
  const order = await getOrderForUser(params.number, me.userId)
  if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found.")
  if (order.status !== "pending") throw new ApiError(409, "INVALID_TRANSITION", "A paid order can only be cancelled by our support team.")
  return ok(await cancelOrder({ number: order.number, actorId: me.userId, actorLabel: "Customer" }))
}, { limit: { max: 10, windowSec: 60 } })
