// Customer-facing coupon rules for the demo store. The server must re-validate
// code, dates, usage limits and minimum order at checkout.
import type { CouponRule } from "@/lib/pricing"

export type CustomerCoupon = CouponRule & { status: "active" | "expired" | "used" }

export const couponRules: CustomerCoupon[] = [
  { code: "WELCOME10", kind: "percent", value: 10, minOrderPaise: 49900, description: "10% off your order", expires: "31 Dec 2026", status: "active" },
  { code: "FLAT200", kind: "flat", value: 20000, minOrderPaise: 199900, description: "₹200 off orders above ₹1,999", expires: "30 Nov 2026", status: "active" },
  { code: "WEEKEND20", kind: "percent", value: 20, minOrderPaise: 99900, description: "20% off weekend deals", expires: "15 Nov 2026", status: "expired" },
  { code: "FIRST100", kind: "flat", value: 10000, minOrderPaise: 99900, description: "₹100 off your first order", expires: "31 Oct 2026", status: "used" },
]

export const findCoupon = (code: string) =>
  couponRules.find((c) => c.code === code.trim().toUpperCase())

/** Why a coupon can't be applied right now, or null if it can. */
export function couponProblem(c: CustomerCoupon | undefined, subtotalPaise: number): string | null {
  if (!c) return "That code isn't valid."
  if (c.status === "expired") return "This coupon has expired."
  if (c.status === "used") return "You've already used this coupon."
  if (subtotalPaise < c.minOrderPaise) return `Add items worth more to use ${c.code} (minimum order applies).`
  return null
}
