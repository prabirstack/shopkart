import { ok, route } from "@/lib/api/http"
import { adjustStockBody, uuid } from "@/lib/api/schemas"
import { adjustStock } from "@/lib/db/queries"

export const POST = route<{ productId: string }>(async ({ params, require, json }) => {
  const me = require("inventory:write")
  return ok(await adjustStock({ ...(await json(adjustStockBody)), productId: uuid.parse(params.productId), actorId: me.userId }))
}, { limit: { max: 60, windowSec: 60 } })
