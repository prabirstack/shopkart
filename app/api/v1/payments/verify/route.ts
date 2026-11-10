import { ApiError, ok, route } from "@/lib/api/http"
import { verifyPaymentBody } from "@/lib/api/schemas"
import { invalidateProducts } from "@/lib/cache"
import { markOrderPaid, pendingAmount } from "@/lib/db/queries"
import { verifyPaymentSignature } from "@/features/payments/signature"

/**
 * Step 2 of checkout. The browser hands us what Razorpay returned; we trust it only after the
 * HMAC signature checks out, and only for the signed-in customer's own order. Safe to call twice.
 */
export const POST = route(async ({ json, user }) => {
  const me = user()
  const b = await json(verifyPaymentBody)
  if (!verifyPaymentSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) throw new ApiError(400, "BAD_SIGNATURE", "We couldn't verify this payment.")
  // The amount comes from our own payment row, never from the client.
  const { amountPaise } = await pendingAmount(b.razorpay_order_id)
  const { order, alreadyPaid } = await markOrderPaid({ providerOrderId: b.razorpay_order_id, providerPaymentId: b.razorpay_payment_id, amountPaise, onlyForUserId: me.userId })
  if (!alreadyPaid) invalidateProducts(order.items.map((i) => i.productId)) // stock moved from reserved to sold
  return ok({ order, alreadyPaid })
}, { limit: { max: 10, windowSec: 60 } })
