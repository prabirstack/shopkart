import { beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { deleteReview, getProductBySlug, listApprovedReviews, listReviewsForModeration, moderateReview, submitReview } from "../../lib/db/queries"
import { makeCatalog, makeProduct, makeUser, resetDb } from "../helpers"

const base = { authorName: "Neha", title: "Great value", body: "Works well and arrived on time, very happy with it." }

describe("reviews", () => {
  let p: Awaited<ReturnType<typeof makeProduct>>
  beforeEach(async () => { await resetDb(); p = await makeProduct(await makeCatalog(), { slug: "thing" }) })
  const totals = async () => { const [r] = await db.select().from(s.products).where(eq(s.products.id, p.id)); return { count: r.ratingCount, sum: r.ratingSum } }

  it("stores new reviews as pending and hides them from the public until approved", async () => {
    const r = await submitReview({ ...base, productId: p.id, rating: 5 })
    expect(await listApprovedReviews(p.id)).toEqual([])
    expect(await totals()).toEqual({ count: 0, sum: 0 })
    expect((await listReviewsForModeration("pending")).map((x) => x.review.id)).toEqual([r.id])
  })

  it("validates input with clear messages", async () => {
    await expect(submitReview({ ...base, productId: p.id, rating: 0 })).rejects.toMatchObject({ code: "INVALID_REVIEW" })
    await expect(submitReview({ ...base, productId: p.id, rating: 5, body: "too short" })).rejects.toMatchObject({ code: "INVALID_REVIEW" })
    await expect(submitReview({ ...base, productId: p.id, rating: 5, title: "x" })).rejects.toMatchObject({ code: "INVALID_REVIEW" })
  })

  it("keeps rating totals exact through approve, reject, re-approve and repeat", async () => {
    const a = await submitReview({ ...base, productId: p.id, rating: 5 }); const b = await submitReview({ ...base, productId: p.id, rating: 3 })
    await moderateReview({ reviewId: a.id, status: "approved", actorId: null }); await moderateReview({ reviewId: b.id, status: "approved", actorId: null })
    expect(await totals()).toEqual({ count: 2, sum: 8 })
    expect((await getProductBySlug("thing"))).toMatchObject({ rating: 4, ratingCount: 2 })
    expect(await moderateReview({ reviewId: a.id, status: "approved", actorId: null })).toEqual({ changed: false })
    await moderateReview({ reviewId: a.id, status: "rejected", actorId: null })
    expect(await totals()).toEqual({ count: 1, sum: 3 })
    await moderateReview({ reviewId: a.id, status: "approved", actorId: null })
    expect(await totals()).toEqual({ count: 2, sum: 8 })
    expect((await listApprovedReviews(p.id)).map((r) => r.rating).sort()).toEqual([3, 5])
  })

  it("stays consistent when the same review is approved simultaneously", async () => {
    const a = await submitReview({ ...base, productId: p.id, rating: 4 })
    await Promise.all([1, 2, 3].map(() => moderateReview({ reviewId: a.id, status: "approved", actorId: null })))
    expect(await totals()).toEqual({ count: 1, sum: 4 })
  })

  it("deleting an approved review removes its rating; deleting a pending one doesn't", async () => {
    const a = await submitReview({ ...base, productId: p.id, rating: 5 }); const b = await submitReview({ ...base, productId: p.id, rating: 2 })
    await moderateReview({ reviewId: a.id, status: "approved", actorId: null })
    await deleteReview({ reviewId: b.id, actorId: null }); expect(await totals()).toEqual({ count: 1, sum: 5 })
    await deleteReview({ reviewId: a.id, actorId: null }); expect(await totals()).toEqual({ count: 0, sum: 0 })
    expect(await deleteReview({ reviewId: a.id, actorId: null })).toEqual({ deleted: false })
  })

  it("allows one review per signed-in customer per product, and writes an audit trail", async () => {
    const u = await makeUser()
    const r = await submitReview({ ...base, productId: p.id, rating: 4, userId: u.id })
    await expect(submitReview({ ...base, productId: p.id, rating: 5, userId: u.id })).rejects.toMatchObject({ code: "ALREADY_REVIEWED" })
    await moderateReview({ reviewId: r.id, status: "approved", actorId: u.id })
    expect(await db.select().from(s.auditEvents)).toHaveLength(1)
  })
})
