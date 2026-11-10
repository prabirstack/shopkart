import { ok, route } from "@/lib/api/http"
import { refundOrder } from "@/lib/db/queries"

/** Records a refund on a delivered order. Moving the money itself happens with the payment provider. */
export const POST = route<{ number: string }>(async ({ params, require }) => {
  const me = require("returns:manage")
  return ok(await refundOrder({ number: params.number, actorId: me.userId, actorLabel: me.name }))
}, { limit: { max: 20, windowSec: 60 } })
