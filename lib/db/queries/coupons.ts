import "server-only"

import { and, eq } from "drizzle-orm"

import { db } from "../index"
import { couponRedemptions, coupons } from "../schema"
import type { CouponRule } from "@/lib/pricing"

type CouponRow = typeof coupons.$inferSelect

/** Why a coupon can't be used right now, or null when it can. The same rules checkout enforces. */
export function couponProblem(c: CouponRow | undefined, subtotalPaise: number, now: Date): string | null {
  if (!c) return "That code isn't valid."
  if (!c.isActive) return "This coupon is not active."
  if (c.startsAt && c.startsAt > now) return "This coupon isn't valid yet."
  if (c.expiresAt < now) return "This coupon has expired."
  if (c.usedCount >= c.usageLimit) return "This coupon has been fully used."
  if (subtotalPaise < c.minOrderPaise) return "Your order is below this coupon's minimum."
  return null
}

export const toCouponRule = (c: CouponRow): CouponRule => ({
  code: c.code, kind: c.kind, value: c.value, minOrderPaise: c.minOrderPaise,
  description: c.kind === "percent" ? `${c.value}% off` : "Flat discount", expires: c.expiresAt.toISOString().slice(0, 10),
})

export async function getCouponByCode(code: string) {
  const [c] = await db.select().from(coupons).where(eq(coupons.code, code.trim().toUpperCase())).limit(1)
  return c
}

/** One use per customer: has this customer already redeemed this coupon? */
export async function hasRedeemedCoupon(couponId: string, userId: string): Promise<boolean> {
  const [r] = await db.select({ id: couponRedemptions.id }).from(couponRedemptions).where(and(eq(couponRedemptions.couponId, couponId), eq(couponRedemptions.userId, userId))).limit(1)
  return !!r
}
