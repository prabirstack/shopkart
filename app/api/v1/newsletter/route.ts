import { ok, route } from "@/lib/api/http"
import { newsletterBody } from "@/lib/api/schemas"
import { subscribeNewsletter } from "@/lib/db/queries"

/**
 * Newsletter signup. The answer is the same whether or not the address was already subscribed, so this can't be used
 * to discover who is on the list. A hidden honeypot field catches bots (acknowledged, never stored).
 */
export const POST = route(async ({ json }) => {
  const b = await json(newsletterBody)
  if (!b.website) await subscribeNewsletter(b.email, b.source)
  return ok({ subscribed: true })
}, { limit: { max: 5, windowSec: 600 } })
