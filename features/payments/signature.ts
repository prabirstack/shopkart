import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Dummy-gateway secret. A real integration reads RAZORPAY_KEY_SECRET and never
 * ships a fallback; this one only exists so the demo works with zero setup.
 */
export function paymentSecret(): string {
  const secret = process.env.MOCK_PAYMENT_SECRET ?? process.env.RAZORPAY_KEY_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === "production") throw new Error("MOCK_PAYMENT_SECRET is not set")
  return "shopkart-dev-only-secret"
}

/** Same scheme as Razorpay: HMAC-SHA256 of "order_id|payment_id". */
export function signPayment(orderId: string, paymentId: string): string {
  return createHmac("sha256", paymentSecret()).update(`${orderId}|${paymentId}`).digest("hex")
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = Buffer.from(signPayment(orderId, paymentId), "hex")
  const given = Buffer.from(/^[0-9a-f]+$/i.test(signature) ? signature : "", "hex")
  return given.length === expected.length && timingSafeEqual(given, expected)
}
