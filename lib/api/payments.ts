import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

import { paymentSecret } from "@/features/payments/signature"

/** Webhooks are signed with their own secret from the Razorpay dashboard, separate from the API key secret. */
export function webhookSecret(): string {
  const s = process.env.RAZORPAY_WEBHOOK_SECRET
  if (s) return s
  if (process.env.NODE_ENV === "production") throw new Error("RAZORPAY_WEBHOOK_SECRET is not set")
  return paymentSecret()
}

/** Razorpay signs the exact raw request body with HMAC-SHA256 (hex). Compare in constant time. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !/^[0-9a-f]+$/i.test(signature)) return false
  const expected = createHmac("sha256", webhookSecret()).update(rawBody).digest()
  const given = Buffer.from(signature, "hex")
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/**
 * The dummy payment gateway used for local development. It must never be reachable where real money or real
 * customers are involved, so it needs BOTH a non-production build AND an explicit opt-in. Orders created while it
 * is on get an `order_mock_` provider id, and the mock gateway only ever signs ids with that prefix, so it can't
 * be used to confirm an order that belongs to the real gateway.
 */
export const MOCK_ORDER_PREFIX = "order_mock_"
export const mockPaymentsEnabled = () => process.env.NODE_ENV !== "production" && process.env.ENABLE_MOCK_PAYMENTS === "1"
