import { ok, route } from "@/lib/api/http"
import { bulkProductsBody } from "@/lib/api/schemas"
import { deleteProducts, setProductsStatus } from "@/lib/db/queries"

/** One action on several products. Deleting only works for products that were never ordered. */
export const POST = route(async ({ require, json }) => {
  const me = require("catalog:write")
  const { ids, action } = await json(bulkProductsBody)
  if (action === "delete") return ok(await deleteProducts(ids, me.userId))
  return ok(await setProductsStatus(ids, action === "publish" ? "published" : action === "unpublish" ? "draft" : "archived", me.userId))
}, { limit: { max: 30, windowSec: 60 }, invalidates: ["catalog"] })
