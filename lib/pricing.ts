import { applyDiscount, gstFromInclusive } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE, SHIPPING_FEE_PAISE } from "@/lib/store-config"

export type CouponRule = {
  code: string
  kind: "percent" | "flat"
  value: number // percent, or paise for flat
  minOrderPaise: number
  description: string
  expires: string
}

export type QuoteLine = { pricePaise: number; quantity: number; gstPercent: number }

export type Quote = {
  subtotalPaise: number
  discountPaise: number
  shippingPaise: number
  /** GST already contained in the prices, shown for transparency. */
  gstIncludedPaise: number
  totalPaise: number
}

/** Display-only quote. The server must recompute every amount before charging. */
export function quote(lines: QuoteLine[], coupon: CouponRule | null): Quote {
  const subtotal = lines.reduce((s, l) => s + l.pricePaise * l.quantity, 0)
  const eligible = coupon !== null && subtotal >= coupon.minOrderPaise
  const discount = !eligible || !coupon ? 0
    : coupon.kind === "percent" ? subtotal - applyDiscount(subtotal, coupon.value)
    : Math.min(coupon.value, subtotal)
  const afterDiscount = subtotal - discount
  const shipping = subtotal === 0 || afterDiscount >= FREE_DELIVERY_ABOVE_PAISE ? 0 : SHIPPING_FEE_PAISE
  // Spread the discount across lines in proportion to their value before taking GST out.
  const gst = lines.reduce((sum, l) => {
    const lineTotal = l.pricePaise * l.quantity
    const share = subtotal === 0 ? 0 : Math.round((lineTotal / subtotal) * discount)
    return sum + gstFromInclusive(lineTotal - share, l.gstPercent)
  }, 0)
  return { subtotalPaise: subtotal, discountPaise: discount, shippingPaise: shipping, gstIncludedPaise: gst, totalPaise: afterDiscount + shipping }
}
