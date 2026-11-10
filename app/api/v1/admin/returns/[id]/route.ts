import { ok, route } from "@/lib/api/http"
import { returnStatusBody, uuid } from "@/lib/api/schemas"
import { setReturnStatus } from "@/lib/db/queries"

export const PATCH = route<{ id: string }>(async ({ params, require, json }) => { const me = require("returns:manage"); return ok(await setReturnStatus(uuid.parse(params.id), (await json(returnStatusBody)).status, me.userId)) })
