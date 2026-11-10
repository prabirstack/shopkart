import { ok, route } from "@/lib/api/http"
import { cancelOrder } from "@/lib/db/queries"

export const POST = route<{ number: string }>(async ({ params, require }) => {
  const me = require("orders:cancel")
  return ok(await cancelOrder({ number: params.number, actorId: me.userId, actorLabel: me.name }))
})
