import { noContent, ok, route } from "@/lib/api/http"
import { couponPatch, uuid } from "@/lib/api/schemas"
import { deleteCoupon, updateCoupon } from "@/lib/db/queries"

export const PATCH = route<{ id: string }>(async ({ params, require, json }) => { const me = require("coupons:write"); return ok(await updateCoupon(uuid.parse(params.id), await json(couponPatch), me.userId)) })
export const DELETE = route<{ id: string }>(async ({ params, require }) => { const me = require("coupons:write"); await deleteCoupon(uuid.parse(params.id), me.userId); return noContent() })
