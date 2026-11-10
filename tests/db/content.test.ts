import { beforeEach, describe, expect, it } from "vitest"

import { getCouponByCode, couponProblem, getPublishedArticle, getSettings, listActiveBanners, listArticlesForAdmin, listPublishedArticles, saveArticle, saveSettings, setArticleStatus } from "../../lib/db/queries"
import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { makeCatalog, makeCoupon, makeProduct, resetDb } from "../helpers"

const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] }
const article = (o = {}) => ({ slug: "guide-1", title: "Guide", excerpt: "An excerpt", category: "buying_guide" as const, authorName: "Team", status: "draft" as const, doc, seoTitle: "", seoDescription: "", featuredProductIds: [], compareProductIds: [], ...o })

describe("articles", () => {
  beforeEach(resetDb)
  it("hides drafts from the public, publishes with a date, and keeps the first publish date on edits", async () => {
    const id = await saveArticle(article())
    expect(await getPublishedArticle("guide-1")).toBeNull(); expect(await listPublishedArticles()).toEqual([])
    await setArticleStatus(id, "published")
    const pub = (await getPublishedArticle("guide-1"))!; expect(pub.publishedAt).toBeInstanceOf(Date)
    await saveArticle({ ...article({ status: "published", title: "Guide v2" }), id })
    expect((await getPublishedArticle("guide-1"))).toMatchObject({ title: "Guide v2", publishedAt: pub.publishedAt })
    expect((await listArticlesForAdmin())).toHaveLength(1)
  })
  it("saves featured and compared products in order, replacing them on update", async () => {
    const cat = await makeCatalog(); const a = await makeProduct(cat), b = await makeProduct(cat), c = await makeProduct(cat)
    const id = await saveArticle(article({ status: "published", featuredProductIds: [b.id, a.id], compareProductIds: [a.id, c.id] }))
    expect(await getPublishedArticle("guide-1")).toMatchObject({ featuredProductIds: [b.id, a.id], compareProductIds: [a.id, c.id] })
    await saveArticle({ ...article({ status: "published", featuredProductIds: [c.id] }), id })
    expect(await getPublishedArticle("guide-1")).toMatchObject({ featuredProductIds: [c.id], compareProductIds: [] })
  })
  it("rejects a duplicate slug", async () => { await saveArticle(article()); await expect(saveArticle(article())).rejects.toThrow() })
})

describe("coupons, banners and settings", () => {
  beforeEach(resetDb)
  it("explains why a coupon can't be used", async () => {
    await makeCoupon({ code: "OK", minOrderPaise: 1000 })
    const c = (await getCouponByCode(" ok "))!
    expect(couponProblem(c, 5000, new Date())).toBeNull()
    expect(couponProblem(c, 500, new Date())).toMatch(/minimum/)
    expect(couponProblem(undefined, 5000, new Date())).toMatch(/isn't valid/)
    expect(couponProblem(c, 5000, new Date(Date.now() + 10 * 86_400_000))).toMatch(/expired/)
  })
  it("returns only banners that are live and not paused", async () => {
    const day = 86_400_000, now = Date.now()
    const row = (title: string, o = {}) => ({ title, slot: "home_hero" as const, href: "/x", startsAt: new Date(now - day), endsAt: new Date(now + day), ...o })
    await db.insert(s.banners).values([row("live"), row("paused", { isPaused: true }), row("ended", { endsAt: new Date(now - 1000) }), row("future", { startsAt: new Date(now + 1000) }), row("other slot", { slot: "cart_banner" })])
    expect((await listActiveBanners("home_hero")).map((b) => b.title)).toEqual(["live"])
  })
  it("rejects banner links that leave the site", async () => {
    await expect(db.insert(s.banners).values({ title: "x", slot: "home_hero", href: "https://evil.example", startsAt: new Date(), endsAt: new Date() })).rejects.toThrow()
  })
  it("saves settings as an upsert", async () => {
    await saveSettings({ storeName: "ShopKart", delivery: { fee: 4900 } }); await saveSettings({ storeName: "ShopKart India" })
    expect(await getSettings()).toEqual({ storeName: "ShopKart India", delivery: { fee: 4900 } })
  })
})
