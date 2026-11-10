import "server-only"

import { ApiError } from "./http"
import { paymentMode } from "./payments"
import { RazorpayError, refundRazorpayPayment } from "./razorpay"

/**
 * Sends money back for a payment, for the refund endpoints. It runs INSIDE the database transaction that holds the
 * order (and return) row locks, so only one refund per order can be in flight, and if it throws nothing is recorded.
 * - A payment from the dummy gateway (pay_mock_...) has nothing to send back: it is only recorded (returns undefined).
 * - A real Razorpay payment is refunded through the API; `idempotencyKey` makes Razorpay hand back the same refund if
 *   this is ever repeated, so the customer can't be paid twice.
 */
export async function sendRefund(input: { payment: { providerPaymentId: string | null; amountPaise: number } | null; amountPaise: number; receipt: string; notes: Record<string, string>; idempotencyKey: string; what: string }): Promise<string | undefined> {
  const paymentId = input.payment?.providerPaymentId
  if (!paymentId || paymentId.startsWith("pay_mock_") || input.amountPaise <= 0) return undefined
  if (paymentMode() !== "razorpay") throw new ApiError(503, "PAYMENTS_NOT_CONFIGURED", "This payment was made through Razorpay, but Razorpay isn't configured here, so the money can't be sent back.")
  try {
    return (await refundRazorpayPayment({ paymentId, amountPaise: input.amountPaise, receipt: input.receipt, notes: input.notes, idempotencyKey: input.idempotencyKey })).id
  } catch (e) {
    console.error(`[payments] refund failed for ${input.receipt}:`, e instanceof RazorpayError ? `${e.status} ${e.message}` : e)
    throw new ApiError(502, "REFUND_FAILED", e instanceof RazorpayError && e.status >= 400 && e.status < 500 ? `Razorpay refused the refund: ${e.message}` : `Razorpay couldn't process the refund right now. The ${input.what} was not changed; try again.`)
  }
}
