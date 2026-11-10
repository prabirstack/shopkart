import { created, route } from "@/lib/api/http"
import { contactBody } from "@/lib/api/schemas"
import { createContactMessage, messageReference } from "@/lib/db/queries"

/**
 * The public contact form. No sign-in needed (a signed-in sender is linked to their account). Spam defences: a hidden
 * honeypot field that bots fill in (such a message is acknowledged and silently dropped, so bots learn nothing),
 * strict length limits, and a tight rate limit per client and per account.
 */
export const POST = route(async ({ json, session }) => {
  const b = await json(contactBody)
  if (b.website) return created({ received: true, reference: "MSG-000000" })
  const row = await createContactMessage({ name: b.name, email: b.email, topic: b.topic, orderNumber: b.orderNumber, message: b.message, userId: session?.userId })
  return created({ received: true, reference: messageReference(row.id) })
}, { limit: { max: 5, windowSec: 600 } })
