import { ok, route } from "@/lib/api/http"
import { inboxStatusBody, uuid } from "@/lib/api/schemas"
import { setContactStatus } from "@/lib/db/queries"

export const PATCH = route<{ id: string }>(async ({ params, require, json }) => {
  const me = require("inbox:manage")
  return ok(await setContactStatus(uuid.parse(params.id), (await json(inboxStatusBody)).status, me.userId))
})
