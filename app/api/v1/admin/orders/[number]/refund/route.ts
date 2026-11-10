import { ApiError, ok, route } from "@/lib/api/http"
import { paymentMode } from "@/lib/api/payments"
import { RazorpayError, refundRazorpayPayment } from "@/lib/api/razorpay"
import { DomainError, getRefundablePayment, refundOrder } from "@/lib/db/queries"

/**
 * Refunds a delivered order. A payment made through real Razorpay is refunded through the Razorpay API FIRST, and
 * the order is only marked refunded if that succeeds, so the books never say "refunded" when no money moved.
 * A payment from the dummy gateway (pay_mock_...) has nothing to send back: it is only recorded.
 */
export const POST = route<{ number: string }>(async ({ params, require }) => {
  const me = require("returns:manage")
  const { orderStatus, payment } = await getRefundablePayment(params.number)
  if (orderStatus !== "delivered") throw new DomainError("INVALID_TRANSITION", `Only delivered orders can be refunded, and this one is ${orderStatus}.`)

  let providerRefundId: string | undefined
  if (payment?.providerPaymentId && !payment.providerPaymentId.startsWith("pay_mock_")) {
    if (paymentMode() !== "razorpay") throw new ApiError(503, "PAYMENTS_NOT_CONFIGURED", "This payment was made through Razorpay, but Razorpay isn't configured here, so the money can't be sent back.")
    try {
      providerRefundId = (await refundRazorpayPayment({ paymentId: payment.providerPaymentId, amountPaise: payment.amountPaise, receipt: params.number, notes: { shopOrder: params.number } })).id
    } catch (e) {
      console.error(`[payments] refund failed for ${params.number}:`, e instanceof RazorpayError ? `${e.status} ${e.message}` : e)
      throw new ApiError(502, "REFUND_FAILED", e instanceof RazorpayError && e.status >= 400 && e.status < 500 ? `Razorpay refused the refund: ${e.message}` : "Razorpay couldn't process the refund right now. The order was not changed; try again.")
    }
  }
  return ok(await refundOrder({ number: params.number, actorId: me.userId, actorLabel: me.name, providerRefundId }))
}, { limit: { max: 20, windowSec: 60 } })
