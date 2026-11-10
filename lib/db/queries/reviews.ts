import "server-only"

import { and, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "../index"
import { auditEvents, orderItems, orders, products, reviews } from "../schema"
import { DomainError, isUniqueViolation } from "./errors"
import type { ReviewDTO } from "./types"

export const reviewInput = z.object({
  productId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  authorName: z.string().trim().min(2, "Enter the name to show with your review.").max(40),
  rating: z.number().int().min(1, "Choose a star rating.").max(5),
  title: z.string().trim().min(3, "Add a short headline.").max(80),
  body: z.string().trim().min(20, "Tell others a little more (at least 20 characters).").max(1500),
  verifiedPurchase: z.boolean().default(false),
})
export type ReviewInput = z.input<typeof reviewInput>

const toDTO = (r: typeof reviews.$inferSelect): ReviewDTO => ({ id: r.id, productId: r.productId, authorName: r.authorName, rating: r.rating, title: r.title, body: r.body, verifiedPurchase: r.verifiedPurchase, helpfulCount: r.helpfulCount, createdAt: r.createdAt })

/** Public reviews: only approved ones, newest first. */
export async function listApprovedReviews(productId: string, opts: { limit?: number; offset?: number } = {}): Promise<ReviewDTO[]> {
  const rows = await db.select().from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.status, "approved"))).orderBy(desc(reviews.createdAt)).limit(opts.limit ?? 20).offset(opts.offset ?? 0)
  return rows.map(toDTO)
}

/** Stores a new review as pending. It is invisible to everyone else until staff approve it. */
export async function submitReview(raw: ReviewInput): Promise<ReviewDTO> {
  const parsed = reviewInput.safeParse(raw)
  if (!parsed.success) throw new DomainError("INVALID_REVIEW", parsed.error.issues[0]?.message ?? "Invalid review.")
  const input = parsed.data
  try {
    const [row] = await db.insert(reviews).values({ productId: input.productId, userId: input.userId ?? null, authorName: input.authorName, rating: input.rating, title: input.title, body: input.body, verifiedPurchase: input.verifiedPurchase, status: "pending" }).returning()
    return toDTO(row)
  } catch (e) {
    if (isUniqueViolation(e)) throw new DomainError("ALREADY_REVIEWED", "You have already reviewed this product.")
    throw e
  }
}

export async function listReviewsForModeration(status: "pending" | "approved" | "rejected") {
  return db.select({ review: reviews, productTitle: products.title, productSlug: products.slug }).from(reviews).innerJoin(products, eq(products.id, reviews.productId)).where(eq(reviews.status, status)).orderBy(desc(reviews.createdAt))
}

/**
 * Changes a review's status and keeps the product's rating totals exactly in step, in one
 * transaction: approving adds the star rating, un-approving removes it. Repeating the same
 * status is a harmless no-op.
 */
export async function moderateReview(input: { reviewId: string; status: "pending" | "approved" | "rejected"; actorId: string | null }) {
  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(reviews).where(eq(reviews.id, input.reviewId)).for("update")
    if (!r) throw new DomainError("NOT_FOUND", "Review not found.")
    if (r.status === input.status) return { changed: false }
    const delta = (input.status === "approved" ? 1 : 0) - (r.status === "approved" ? 1 : 0)
    if (delta !== 0) await tx.update(products).set({ ratingCount: sql`${products.ratingCount} + ${delta}`, ratingSum: sql`${products.ratingSum} + ${delta * r.rating}` }).where(eq(products.id, r.productId))
    await tx.update(reviews).set({ status: input.status }).where(eq(reviews.id, r.id))
    await tx.insert(auditEvents).values({ actorId: input.actorId, action: "review.moderate", entity: "review", entityId: r.id, before: { status: r.status }, after: { status: input.status } })
    return { changed: true }
  })
}

export async function deleteReview(input: { reviewId: string; actorId: string | null }) {
  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(reviews).where(eq(reviews.id, input.reviewId)).for("update")
    if (!r) return { deleted: false }
    if (r.status === "approved") await tx.update(products).set({ ratingCount: sql`${products.ratingCount} - 1`, ratingSum: sql`${products.ratingSum} - ${r.rating}` }).where(eq(products.id, r.productId))
    await tx.delete(reviews).where(eq(reviews.id, r.id))
    await tx.insert(auditEvents).values({ actorId: input.actorId, action: "review.delete", entity: "review", entityId: r.id, before: { status: r.status, rating: r.rating }, after: null })
    return { deleted: true }
  })
}

/** True when the customer has a paid (or later) order containing this product. Used for the "Verified purchase" badge. */
export async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const [row] = await db.select({ id: orders.id }).from(orders).innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.userId, userId), eq(orderItems.productId, productId), sql`${orders.status} in ('paid', 'packed', 'shipped', 'delivered')`)).limit(1)
  return !!row
}

/** Star distribution of approved reviews, e.g. { 5: 40, 4: 12, 3: 2, 2: 0, 1: 1 }. */
export async function reviewSummary(productId: string) {
  const rows = await db.select({ rating: reviews.rating, n: sql<number>`count(*)::int` }).from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.status, "approved"))).groupBy(reviews.rating)
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const r of rows) distribution[r.rating] = r.n
  const count = Object.values(distribution).reduce((a, b) => a + b, 0)
  const sum = Object.entries(distribution).reduce((a, [k, v]) => a + Number(k) * v, 0)
  return { count, average: count ? Math.round((sum / count) * 10) / 10 : null, distribution }
}
