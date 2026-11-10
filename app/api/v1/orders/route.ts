import { randomBytes } from "node:crypto"

import { created, ok, route } from "@/lib/api/http"
import { createOrderBody } from "@/lib/api/schemas"
import { createOrder, listOrdersForUser } from "@/lib/db/queries"

export const GET = route(async ({ user }) => ok(await listOrdersForUser(user().userId)))

/**
 * Places an order and reserves stock. Send an `Idempotency-Key` header (any unique string, 8 to 80
 * characters) so a retried or double-clicked request returns the first order instead of a second one.
 * The response carries the payment details the Razorpay checkout needs.
 */
export const POST = route(async ({ json, user, req }) => {
  const me = user()
  const body = await json(createOrderBody)
  const key = req.headers.get("idempotency-key")
  const idempotencyKey = key && key.length >= 8 && key.length <= 80 ? key : null
  const order = await createOrder({ userId: me.userId, items: body.items, couponCode: body.couponCode, customer: body.customer, shipTo: body.shipTo, providerOrderId: `order_${randomBytes(9).toString("hex")}`, idempotencyKey })
  const payment = order.payments[0]
  return created({ order, payment: { providerOrderId: payment.providerOrderId, amountPaise: payment.amountPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID ?? null } })
}, { limit: { max: 10, windowSec: 60 } })
