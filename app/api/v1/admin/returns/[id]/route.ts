import { ok, route } from "@/lib/api/http"
import { sendRefund } from "@/lib/api/refunds"
import { returnStatusBody, uuid } from "@/lib/api/schemas"
import { invalidateProducts } from "@/lib/cache"
import { setReturnStatus } from "@/lib/db/queries"

/**
 * Moves a return along its flow. "received" puts the units back on the shelf. "refunded" sends the return's amount
 * (a partial refund of the order's payment) through Razorpay for a real payment, INSIDE the transaction that holds the
 * order and return locks: a double click or a second admin waits, then finds the return already refunded, so the money
 * can only leave once. If Razorpay refuses or is down, nothing is recorded. A dummy-gateway payment is only recorded.
 */
export const PATCH = route<{ id: string }>(async ({ params, require, json }) => {
  const me = require("returns:manage")
  const { status } = await json(returnStatusBody)
  const { row, restockedProductIds } = await setReturnStatus(uuid.parse(params.id), status, me.userId, {
    gateway: (c) => sendRefund({ payment: c.payment, amountPaise: c.refundPaise, receipt: c.number, notes: { shopOrder: c.orderNumber, return: c.number }, idempotencyKey: c.returnId, what: "return" }),
  })
  invalidateProducts(restockedProductIds) // units are back on the shelf: refresh just these products
  return ok(row)
}, { limit: { max: 60, windowSec: 60 } })
