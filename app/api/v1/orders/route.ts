import { randomBytes } from "node:crypto"

import { ApiError, created, ok, route } from "@/lib/api/http"
import { createOrderBody } from "@/lib/api/schemas"
import { MOCK_ORDER_PREFIX, PENDING_GATEWAY_PREFIX, paymentMode } from "@/lib/api/payments"
import { RazorpayError, createRazorpayOrder } from "@/lib/api/razorpay"
import { invalidateProducts } from "@/lib/cache"
import { cancelOrder, createOrder, listOrdersForUser, setProviderOrderId } from "@/lib/db/queries"

export const GET = route(async ({ user }) => ok(await listOrdersForUser(user().userId)))

/**
 * Places an order and reserves stock. Send an `Idempotency-Key` header (any unique string, 8 to 80
 * characters) so a retried or double-clicked request returns the first order instead of a second one.
 *
 * The response carries what the payment window needs. With real Razorpay the order is saved first, so the amount
 * comes from the stored total, and then the matching Razorpay order is created and attached. If Razorpay can't be
 * reached the order is cancelled (stock released) and the shopper is told to try again: nothing is left half-made.
 */
export const POST = route(async ({ json, user, req }) => {
  const me = user()
  const mode = paymentMode()
  // Refuse up front: an order nobody can pay for would only hold stock.
  if (mode === "none") throw new ApiError(503, "PAYMENTS_NOT_CONFIGURED", "Online payments aren't set up on this site yet.")

  const body = await json(createOrderBody)
  const key = req.headers.get("idempotency-key")
  const idempotencyKey = key && key.length >= 8 && key.length <= 80 ? key : null
  const providerOrderId = mode === "mock" ? `${MOCK_ORDER_PREFIX}${randomBytes(9).toString("hex")}` : `${PENDING_GATEWAY_PREFIX}${randomBytes(9).toString("hex")}`
  const order = await createOrder({ userId: me.userId, items: body.items, couponCode: body.couponCode, customer: body.customer, shipTo: body.shipTo, providerOrderId, idempotencyKey })
  invalidateProducts(order.items.map((i) => i.productId)) // stock labels on just these products

  let payment = order.payments[0]
  if (mode === "razorpay" && order.status === "pending" && payment.providerOrderId.startsWith(PENDING_GATEWAY_PREFIX)) {
    // Also covers a retried request whose first attempt saved the order but never reached Razorpay.
    try {
      const gateway = await createRazorpayOrder({ amountPaise: payment.amountPaise, receipt: order.number, notes: { shopOrder: order.number } })
      await setProviderOrderId(order.id, gateway.id)
      payment = { ...payment, providerOrderId: gateway.id }
    } catch (e) {
      console.error(`[payments] could not create a Razorpay order for ${order.number}:`, e instanceof RazorpayError ? `${e.status} ${e.message}` : e)
      await cancelOrder({ number: order.number, actorId: null, actorLabel: "System", onlyStatuses: ["pending"] }).catch(() => undefined)
      invalidateProducts(order.items.map((i) => i.productId))
      throw new ApiError(502, "PAYMENT_UNAVAILABLE", "We couldn't start the payment just now. Nothing was charged. Please try again in a moment.")
    }
  }
  return created({ order, payment: { providerOrderId: payment.providerOrderId, amountPaise: payment.amountPaise, currency: "INR", mode, keyId: mode === "razorpay" ? process.env.RAZORPAY_KEY_ID ?? null : null } })
}, { limit: { max: 10, windowSec: 60 } })
