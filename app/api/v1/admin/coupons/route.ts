import { created, ok, route } from "@/lib/api/http"
import { couponBody } from "@/lib/api/schemas"
import { createCoupon, listCoupons } from "@/lib/db/queries"

export const GET = route(async ({ require }) => { require("coupons:write"); return ok(await listCoupons()) })
export const POST = route(async ({ require, json }) => { const me = require("coupons:write"); return created(await createCoupon(await json(couponBody), me.userId)) })
