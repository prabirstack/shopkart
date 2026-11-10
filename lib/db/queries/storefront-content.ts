import "server-only"

import { and, desc, eq, gt, inArray, or, sql } from "drizzle-orm"

import { db } from "../index"
import { coupons, reviewVotes, reviews } from "../schema"
import { DomainError } from "./errors"

/**
 * Marks a review helpful for this customer, or removes their mark when they already gave one.
 * The vote row and reviews.helpful_count change in one transaction, so the count always equals the
 * number of votes. Only approved reviews can be voted on, and never by their own author.
 */
export async function toggleHelpfulVote(reviewId: string, userId: string): Promise<{ helpful: boolean; count: number }> {
  return db.transaction(async (tx) => {
    const [review] = await tx.select().from(reviews).where(eq(reviews.id, reviewId)).for("update")
    if (!review || review.status !== "approved") throw new DomainError("NOT_FOUND", "Review not found.")
    if (review.userId === userId) throw new DomainError("OWN_REVIEW", "You can't mark your own review as helpful.")
    const removed = await tx.delete(reviewVotes).where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, userId))).returning({ id: reviewVotes.reviewId })
    if (removed.length === 0) await tx.insert(reviewVotes).values({ reviewId, userId })
    const [row] = await tx.update(reviews).set({ helpfulCount: sql`${reviews.helpfulCount} + ${removed.length === 0 ? 1 : -1}` }).where(eq(reviews.id, reviewId)).returning({ count: reviews.helpfulCount })
    return { helpful: removed.length === 0, count: row.count }
  })
}

/** Which of these reviews the customer has marked helpful, and each review's exact current count (the page itself may be cached). */
export async function reviewVoteState(userId: string, reviewIds: string[]): Promise<{ voted: string[]; counts: Record<string, number> }> {
  if (reviewIds.length === 0) return { voted: [], counts: {} }
  const [mine, current] = await Promise.all([
    db.select({ id: reviewVotes.reviewId }).from(reviewVotes).where(and(eq(reviewVotes.userId, userId), inArray(reviewVotes.reviewId, reviewIds))),
    db.select({ id: reviews.id, count: reviews.helpfulCount }).from(reviews).where(inArray(reviews.id, reviewIds)),
  ])
  return { voted: mine.map((r) => r.id), counts: Object.fromEntries(current.map((r) => [r.id, r.count])) }
}

export type OfferDTO = { code: string; kind: "percent" | "flat"; value: number; minOrderPaise: number }

/** Coupons a shopper can use right now (active, started, not expired, not used up), for the "Available offers" box. */
export async function listActiveOffers(limit = 5): Promise<OfferDTO[]> {
  const now = new Date()
  const rows = await db.select({ code: coupons.code, kind: coupons.kind, value: coupons.value, minOrderPaise: coupons.minOrderPaise }).from(coupons)
    .where(and(eq(coupons.isActive, true), gt(coupons.expiresAt, now), or(sql`${coupons.startsAt} is null`, sql`${coupons.startsAt} <= ${now}`), sql`${coupons.usedCount} < ${coupons.usageLimit}`))
    .orderBy(desc(coupons.createdAt)).limit(limit)
  return rows
}
