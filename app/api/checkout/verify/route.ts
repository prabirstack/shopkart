import { cookies } from "next/headers"
import { z } from "zod"
import { readOrder, signOrder, type PaidOrder } from "@/features/orders/token"
import { verifyPaymentSignature } from "@/features/payments/signature"

const body = z.object({
  orderToken: z.string().max(4000),
  razorpay_order_id: z.string().max(60),
  razorpay_payment_id: z.string().max(60),
  razorpay_signature: z.string().max(200),
})

const fail = (status: number, code: string, message: string) => Response.json({ error: { code, message } }, { status })

/** Step 2: verify the gateway signature against the signed order, then record the paid order. */
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(400, "INVALID_INPUT", "Invalid payment response.")
  const { orderToken, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data

  const order = await readOrder(orderToken)
  if (!order) return fail(410, "ORDER_EXPIRED", "This checkout expired. Please start again.")
  if (order.orderId !== razorpay_order_id) return fail(400, "ORDER_MISMATCH", "Payment does not match this order.")
  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return fail(400, "BAD_SIGNATURE", "We couldn't verify this payment.")
  }

  // Idempotent: the same verified payment always yields the same paid order.
  const paid: PaidOrder = { ...order, paymentId: razorpay_payment_id, paidAt: new Date().toISOString() }
  ;(await cookies()).set("shopkart_last_order", await signOrder(paid, "1h"), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60,
  })
  return Response.json({ ok: true, orderId: order.orderId })
}
