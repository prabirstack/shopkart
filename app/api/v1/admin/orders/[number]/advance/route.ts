import { ok, route } from "@/lib/api/http"
import { advanceBody } from "@/lib/api/schemas"
import { advanceOrder } from "@/lib/db/queries"

export const POST = route<{ number: string }>(async ({ params, require, json }) => {
  const me = require("orders:fulfil")
  return ok(await advanceOrder({ number: params.number, to: (await json(advanceBody)).to, actorId: me.userId, actorLabel: me.name }))
})
