import { ok, route } from "@/lib/api/http"
import { couponPatch, uuid } from "@/lib/api/schemas"
import { updateCoupon } from "@/lib/db/queries"

export const PATCH = route<{ id: string }>(async ({ params, require, json }) => { const me = require("coupons:write"); return ok(await updateCoupon(uuid.parse(params.id), await json(couponPatch), me.userId)) })
