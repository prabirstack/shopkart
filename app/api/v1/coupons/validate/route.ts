import { ok, route } from "@/lib/api/http"
import { couponValidateBody } from "@/lib/api/schemas"
import { couponProblem, getCouponByCode, getProductsByIds, toCouponRule } from "@/lib/db/queries"
import { quote } from "@/lib/pricing"

/** Previews a coupon against a cart using database prices. Checkout re-validates, so this is advice, not a promise. */
export const POST = route(async ({ json }) => {
  const { code, items } = await json(couponValidateBody)
  const merged = new Map<string, number>()
  for (const i of items) merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.quantity)
  const products = await getProductsByIds([...merged.keys()])
  const lines = products.map((p) => ({ pricePaise: p.pricePaise, quantity: merged.get(p.id)!, gstPercent: p.gstPercent }))
  const subtotal = lines.reduce((s, l) => s + l.pricePaise * l.quantity, 0)
  const coupon = await getCouponByCode(code)
  const problem = couponProblem(coupon, subtotal, new Date())
  if (problem || !coupon) return ok({ valid: false, reason: problem })
  return ok({ valid: true, code: coupon.code, totals: quote(lines, toCouponRule(coupon)) })
}, { limit: { max: 20, windowSec: 60 } })
