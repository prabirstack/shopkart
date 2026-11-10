import { ok, route } from "@/lib/api/http"
import { productPatch, uuid } from "@/lib/api/schemas"
import { archiveProduct, updateProduct } from "@/lib/db/queries"

export const PATCH = route<{ id: string }>(async ({ params, require, json }) => { const me = require("catalog:write"); return ok(await updateProduct(uuid.parse(params.id), await json(productPatch), me.userId)) }, { invalidates: ["catalog"] })
/** Archives rather than deletes: ordered products must stay in order history. */
export const DELETE = route<{ id: string }>(async ({ params, require }) => { const me = require("catalog:write"); return ok(await archiveProduct(uuid.parse(params.id), me.userId)) }, { invalidates: ["catalog"] })
