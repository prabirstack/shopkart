import { ok, route } from "@/lib/api/http"
import { sendRefund } from "@/lib/api/refunds"
import { refundOrder } from "@/lib/db/queries"

/**
 * Refunds a delivered order (only what is left after refunded returns). A payment made through real Razorpay is
 * refunded through the Razorpay API INSIDE the transaction that holds the order lock, so a double click waits and then
 * finds the order already refunded: the money can only leave once. If Razorpay fails, the order is not changed.
 * A payment from the dummy gateway (pay_mock_...) has nothing to send back: it is only recorded.
 */
export const POST = route<{ number: string }>(async ({ params, require }) => {
  const me = require("returns:manage")
  return ok(await refundOrder({
    number: params.number, actorId: me.userId, actorLabel: me.name,
    gateway: (payment) => sendRefund({ payment, amountPaise: payment?.amountPaise ?? 0, receipt: params.number, notes: { shopOrder: params.number }, idempotencyKey: `order-${params.number}`, what: "order" }),
  }))
}, { limit: { max: 20, windowSec: 60 } })
