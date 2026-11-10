import { created, route } from "@/lib/api/http"
import { orderNoteBody } from "@/lib/api/schemas"
import { addOrderNote } from "@/lib/db/queries"

export const POST = route<{ number: string }>(async ({ params, require, json }) => {
  const me = require("orders:read")
  return created(await addOrderNote(params.number, (await json(orderNoteBody)).body, me.userId))
}, { limit: { max: 30, windowSec: 60 } })
