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
