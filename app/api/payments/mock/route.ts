import { randomBytes } from "node:crypto"
import { z } from "zod"
import { MOCK_ORDER_PREFIX, mockPaymentsEnabled } from "@/lib/api/payments"
import { signMockPayment } from "@/features/payments/signature"

const body = z.object({ orderId: z.string().startsWith(MOCK_ORDER_PREFIX).max(60), outcome: z.enum(["success", "failure"]) })

/**
 * Plays the part of Razorpay for local testing. It disappears in production so the
 * real gateway is the only thing that can produce a valid signature there.
 */
export async function POST(request: Request) {
  if (!mockPaymentsEnabled()) return new Response("Not found", { status: 404 })
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: { code: "BAD_REQUEST_ERROR", description: "Invalid mock payment request." } }, { status: 400 })
  const { orderId, outcome } = parsed.data
  if (outcome === "failure") {
    return Response.json({ error: { code: "BAD_REQUEST_ERROR", description: "Payment failed (simulated). No money was taken.", reason: "payment_failed" } }, { status: 402 })
  }
  const paymentId = `pay_mock_${randomBytes(7).toString("hex")}`
  return Response.json({ razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signMockPayment(orderId, paymentId) })
}
