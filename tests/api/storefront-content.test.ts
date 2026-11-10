import { eq } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"

import { POST as helpful } from "../../app/api/v1/reviews/[id]/helpful/route"
import { GET as voted } from "../../app/api/v1/reviews/voted/route"
import { GET as listReviews } from "../../app/api/v1/products/[slug]/reviews/route"
import { db } from "../../lib/db"
import { getPublishedArticle, listActiveOffers, listApprovedReviews, listPublishedArticles, moderateReview, saveArticle, submitReview, toggleHelpfulVote } from "../../lib/db/queries"
import { reviewVotes, reviews } from "../../lib/db/schema"
import { makeCatalog, makeCoupon, makeProduct, resetDb } from "../helpers"
import { ctx, json, req, signUp } from "./helpers"

const text = "Boils fast, looks great and feels solid in the hand."
const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] }

describe("storefront content", () => {
  let cat: Awaited<ReturnType<typeof makeCatalog>>
  let product: Awaited<ReturnType<typeof makeProduct>>
  beforeEach(async () => { await resetDb(); cat = await makeCatalog(); product = await makeProduct(cat, { slug: "kettle" }) })

  const review = async (userId: string | null, status: "approved" | "pending" = "approved") => {
    const r = await submitReview({ productId: product.id, userId, authorName: "Someone", rating: 4, title: "Good one", body: text })
    if (status === "approved") await moderateReview({ reviewId: r.id, status: "approved", actorId: null })
    return r.id
  }
  const vote = async (cookie: string | undefined, id: string) => json(await helpful(req(`/api/v1/reviews/${id}/helpful`, { method: "POST", cookie }), ctx({ id })))
  const count = async (id: string) => (await db.select().from(reviews).where(eq(reviews.id, id)))[0].helpfulCount

  describe("helpful votes", () => {
    it("toggles a vote and keeps helpful_count equal to the number of votes", async () => {
      const [a, b] = [await signUp(), await signUp()]
      const id = await review(null)
      expect((await vote(a.cookie, id)).body.data).toEqual({ helpful: true, count: 1 })
      expect((await vote(b.cookie, id)).body.data).toEqual({ helpful: true, count: 2 })
      expect((await vote(a.cookie, id)).body.data).toEqual({ helpful: false, count: 1 })
      expect(await count(id)).toBe(1)
      expect(await db.select().from(reviewVotes).where(eq(reviewVotes.reviewId, id))).toHaveLength(1)
      // The public list shows the stored count.
      const list = await json(await listReviews(req("/api/v1/products/kettle/reviews"), ctx({ slug: "kettle" })))
      expect(list.body.data.items[0].helpfulCount).toBe(1)
    })

    it("keeps the count right when the same person votes at the same time", async () => {
      const a = await signUp()
      const id = await review(null)
      await Promise.all([toggleHelpfulVote(id, a.userId), toggleHelpfulVote(id, a.userId), toggleHelpfulVote(id, a.userId)])
      const rows = await db.select().from(reviewVotes).where(eq(reviewVotes.reviewId, id))
      expect(await count(id)).toBe(rows.length)
    })

    it("refuses a vote on your own review", async () => {
      const a = await signUp()
      const id = await review(a.userId)
      const r = await vote(a.cookie, id)
      expect(r.status).toBe(403); expect(r.body.error.code).toBe("OWN_REVIEW")
      expect(await count(id)).toBe(0)
    })

    it("needs sign-in", async () => {
      const id = await review(null)
      expect((await vote(undefined, id)).status).toBe(401)
      expect((await json(await voted(req(`/api/v1/reviews/voted?ids=${id}`)))).status).toBe(401)
    })

    it("only lets shoppers vote on approved reviews that exist", async () => {
      const a = await signUp()
      expect((await vote(a.cookie, await review(null, "pending"))).status).toBe(404)
      expect((await vote(a.cookie, "00000000-0000-4000-8000-000000000000")).status).toBe(404)
    })

    it("reports which reviews you have already marked", async () => {
      const a = await signUp()
      const [one, two] = [await review(null), await review(null)]
      await vote(a.cookie, one)
      const r = await json(await voted(req(`/api/v1/reviews/voted?ids=${one},${two}`, { cookie: a.cookie })))
      expect(r.body.data).toEqual({ voted: [one], counts: { [one]: 1, [two]: 0 } })
    })

    it("removes votes with the review", async () => {
      const a = await signUp()
      const id = await review(null)
      await vote(a.cookie, id)
      await db.delete(reviews).where(eq(reviews.id, id))
      expect(await db.select().from(reviewVotes)).toHaveLength(0)
    })
  })

  it("lists only approved reviews", async () => {
    await review(null, "approved"); await review(null, "pending")
    const rejected = await review(null, "pending"); await moderateReview({ reviewId: rejected, status: "rejected", actorId: null })
    expect(await listApprovedReviews(product.id)).toHaveLength(1)
  })

  describe("articles", () => {
    const save = (slug: string, status: "draft" | "published") => saveArticle({ slug, title: slug, excerpt: "Short excerpt", category: "news", authorName: "Team", status, doc, seoTitle: "", seoDescription: "", featuredProductIds: [product.id], compareProductIds: [] })
    it("never exposes drafts", async () => {
      await save("live", "published"); await save("secret", "draft")
      expect((await listPublishedArticles()).map((a) => a.slug)).toEqual(["live"])
      expect(await getPublishedArticle("secret")).toBeNull()
      expect((await getPublishedArticle("live"))?.featuredProductIds).toEqual([product.id])
    })
  })

  it("lists only coupons that can be used right now", async () => {
    await makeCoupon({ code: "LIVE10" })
    await makeCoupon({ code: "OFF10", isActive: false })
    await makeCoupon({ code: "OLD10", expiresAt: new Date(Date.now() - 86_400_000) })
    expect((await listActiveOffers()).map((o) => o.code)).toEqual(["LIVE10"])
  })
})
