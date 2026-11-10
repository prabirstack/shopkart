import { ok, route } from "@/lib/api/http"
import { invalidateProducts } from "@/lib/cache"
import { cancelOrder } from "@/lib/db/queries"

/**
 * Customers can cancel their own order until it is paid. After that, support cancels and refunds it.
 * Ownership and status are checked inside the transaction, under the order's row lock, so a payment that
 * lands at the same moment can't be cancelled by a stale check.
 */
export const POST = route<{ number: string }>(async ({ params, user }) => {
  const me = user()
  const order = await cancelOrder({ number: params.number, actorId: me.userId, actorLabel: "Customer", onlyForUserId: me.userId, onlyStatuses: ["pending"], statusMessage: "A paid order can only be cancelled by our support team." })
  invalidateProducts(order.items.map((i) => i.productId)) // the reservation was released: refresh just these products
  return ok(order)
}, { limit: { max: 10, windowSec: 60 } })
