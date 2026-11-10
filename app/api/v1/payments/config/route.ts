import { ok, route } from "@/lib/api/http"
import { paymentMode } from "@/lib/api/payments"

/** What the checkout needs to know before it can take a payment. The key id is public by design; the secret never leaves the server. */
export const GET = route(async () => {
  const mode = paymentMode()
  return ok({ mode, keyId: mode === "razorpay" ? process.env.RAZORPAY_KEY_ID ?? null : null, testMode: mode === "razorpay" && (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_") })
}, { cache: "public, s-maxage=60" })
