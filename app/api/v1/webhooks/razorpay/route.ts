import { ApiError, ok, route } from "@/lib/api/http"
import { markOrderPaid, markPaymentFailed, markWebhookProcessed, recordWebhook } from "@/lib/db/queries"
import { verifyWebhookSignature } from "@/lib/api/payments"

type Event = { event: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; method?: string; error_description?: string } } } }

/**
 * Razorpay calls this server-to-server, so there is no cookie or Origin: authenticity comes from the
 * HMAC signature over the exact raw body. Each event id is stored once, so a redelivery is
 * acknowledged and ignored. Reply 2xx only once the event is safely handled; Razorpay retries otherwise.
 */
export const POST = route(async ({ req }) => {
  const raw = await req.text()
  if (raw.length > 512 * 1024) throw new ApiError(413, "BODY_TOO_LARGE", "Payload too large.")
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) throw new ApiError(401, "BAD_SIGNATURE", "Invalid signature.")
  const eventId = req.headers.get("x-razorpay-event-id")
  if (!eventId) throw new ApiError(400, "MISSING_EVENT_ID", "Missing event id.")
  let evt: Event
  try { evt = JSON.parse(raw) } catch { throw new ApiError(400, "INVALID_JSON", "Invalid JSON.") }

  if (!(await recordWebhook({ provider: "razorpay", eventId, type: evt.event, payload: evt }))) return ok({ received: true, duplicate: true })

  const pay = evt.payload?.payment?.entity
  if (evt.event === "payment.captured" && pay?.id && pay.order_id && typeof pay.amount === "number") {
    await markOrderPaid({ providerOrderId: pay.order_id, providerPaymentId: pay.id, amountPaise: pay.amount, method: pay.method })
  } else if (evt.event === "payment.failed" && pay?.order_id) {
    await markPaymentFailed({ providerOrderId: pay.order_id, reason: pay.error_description ?? "Payment failed" })
  }
  await markWebhookProcessed("razorpay", eventId)
  return ok({ received: true })
}, { noOriginCheck: true, rawBody: true, limit: { max: 300, windowSec: 60 } })
