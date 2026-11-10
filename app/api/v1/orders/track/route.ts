import { z } from "zod"

import { ApiError, ok, route } from "@/lib/api/http"
import { email } from "@/lib/api/schemas"
import { trackOrder } from "@/lib/db/queries"

const trackOrderBody = z.object({ number: z.string().trim().min(3).max(30), email })

/**
 * Public order tracking for guests and email links. The same 404 answers "no such order" and "wrong email",
 * so the endpoint can't be used to find out which order numbers exist or which emails are customers.
 */
export const POST = route(async ({ json }) => {
  const { number, email } = await json(trackOrderBody)
  const order = await trackOrder(number, email)
  if (!order) throw new ApiError(404, "NOT_FOUND", "We couldn't find an order with those details.")
  return ok(order)
}, { limit: { max: 10, windowSec: 60 } })
