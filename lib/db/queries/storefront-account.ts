import "server-only"

import { and, asc, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm"

import { db } from "../index"
import { addresses, couponRedemptions, coupons, orders, wishlistItems } from "../schema"

export type PublicCouponDTO = { code: string; kind: "percent" | "flat"; value: number; minOrderPaise: number; expiresAt: Date }

/** Coupons a shopper could use right now: switched on, already started, not expired, and not fully used. */
export async function listActiveCoupons(now = new Date()): Promise<PublicCouponDTO[]> {
  const rows = await db.select({ code: coupons.code, kind: coupons.kind, value: coupons.value, minOrderPaise: coupons.minOrderPaise, expiresAt: coupons.expiresAt })
    .from(coupons)
    .where(and(eq(coupons.isActive, true), or(isNull(coupons.startsAt), lte(coupons.startsAt, now)), gt(coupons.expiresAt, now), sql`${coupons.usedCount} < ${coupons.usageLimit}`))
    .orderBy(asc(coupons.expiresAt), asc(coupons.code))
  return rows
}

export type CouponUseDTO = { code: string; kind: "percent" | "flat"; value: number; minOrderPaise: number; orderNumber: string; discountPaise: number; redeemedAt: Date }

/** The coupons this customer has used, newest first. Always scoped to the given user. */
export async function listCouponUsesForUser(userId: string): Promise<CouponUseDTO[]> {
  return db.select({ code: coupons.code, kind: coupons.kind, value: coupons.value, minOrderPaise: coupons.minOrderPaise, orderNumber: orders.number, discountPaise: orders.discountPaise, redeemedAt: couponRedemptions.redeemedAt })
    .from(couponRedemptions)
    .innerJoin(coupons, eq(coupons.id, couponRedemptions.couponId))
    .innerJoin(orders, eq(orders.id, couponRedemptions.orderId))
    .where(eq(couponRedemptions.userId, userId))
    .orderBy(desc(couponRedemptions.redeemedAt))
}

/** Counts for the account overview. */
export async function getAccountCounts(userId: string): Promise<{ addresses: number; wishlist: number; defaultAddressLabel: string | null }> {
  const [[a], [w], [d]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(addresses).where(eq(addresses.userId, userId)),
    db.select({ n: sql<number>`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.userId, userId)),
    db.select({ label: addresses.label }).from(addresses).where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true))).limit(1),
  ])
  return { addresses: a.n, wishlist: w.n, defaultAddressLabel: d?.label ?? null }
}
