import type { Quote } from "@/lib/pricing"

export type CouponCheck = { valid: true; code: string; totals: Quote } | { valid: false; reason: string }

/** Asks the server whether a coupon applies to these cart lines, and what the totals would be. Advice only: placing the order re-checks. */
export async function validateCoupon(code: string, items: { productId: string; quantity: number }[]): Promise<CouponCheck> {
  try {
    const res = await fetch("/api/v1/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, items }) })
    const body = await res.json().catch(() => null)
    if (!res.ok) return { valid: false, reason: res.status === 429 ? "Too many tries. Wait a moment and try again." : "We couldn't check this coupon right now." }
    const d = body?.data
    if (d?.valid) return { valid: true, code: d.code, totals: d.totals }
    return { valid: false, reason: d?.reason ?? "That code isn't valid." }
  } catch {
    return { valid: false, reason: "We couldn't check this coupon right now." }
  }
}
