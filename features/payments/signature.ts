import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { MOCK_ORDER_PREFIX, mockPaymentsEnabled } from "@/lib/api/payments"

/** Secret for REAL Razorpay orders. Never used by the mock gateway. The dev fallback exists only outside production (tests, local webhooks). */
export function paymentSecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === "production") throw new Error("RAZORPAY_KEY_SECRET is not set")
  return "shopkart-dev-only-secret"
}

/** Secret for the dummy gateway only, and only while mock payments are switched on. */
function mockSecret(): string {
  if (!mockPaymentsEnabled()) throw new Error("Mock payments are disabled")
  return process.env.MOCK_PAYMENT_SECRET ?? "shopkart-mock-dev-only-secret"
}

const hmac = (secret: string, orderId: string, paymentId: string) => createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")

/** Same scheme as Razorpay: HMAC-SHA256 of "order_id|payment_id", with the real key secret. */
export const signPayment = (orderId: string, paymentId: string) => hmac(paymentSecret(), orderId, paymentId)

/** What the dummy gateway signs with. Throws unless mock payments are enabled. */
export const signMockPayment = (orderId: string, paymentId: string) => hmac(mockSecret(), orderId, paymentId)

/** Mock-prefixed ids are checked against the mock secret (only while mock mode is on, otherwise rejected); every other id against the real secret. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  let expectedHex: string
  if (orderId.startsWith(MOCK_ORDER_PREFIX)) {
    if (!mockPaymentsEnabled()) return false
    expectedHex = signMockPayment(orderId, paymentId)
  } else expectedHex = signPayment(orderId, paymentId)
  const expected = Buffer.from(expectedHex, "hex")
  const given = Buffer.from(/^[0-9a-f]+$/i.test(signature) ? signature : "", "hex")
  return given.length === expected.length && timingSafeEqual(given, expected)
}
