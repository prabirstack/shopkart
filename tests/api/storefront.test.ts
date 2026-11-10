import { beforeEach, describe, expect, it } from "vitest"

import { GET as health } from "../../app/api/v1/health/route"
import { GET as me } from "../../app/api/v1/me/route"
import { GET as listProducts } from "../../app/api/v1/products/route"
import { GET as getProduct } from "../../app/api/v1/products/[slug]/route"
import { GET as listReviews, POST as postReview } from "../../app/api/v1/products/[slug]/reviews/route"
import { GET as categories } from "../../app/api/v1/categories/route"
import { POST as validateCoupon } from "../../app/api/v1/coupons/validate/route"
import { makeCatalog, makeCoupon, makeProduct, resetDb } from "../helpers"
import { ctx, json, req, signUp } from "./helpers"

describe("public API", () => {
  let cat: Awaited<ReturnType<typeof makeCatalog>>
  beforeEach(async () => { await resetDb(); cat = await makeCatalog(); await makeProduct(cat, { slug: "kettle", title: "Steel Kettle", pricePaise: 150000 }); await makeProduct(cat, { slug: "hidden", status: "draft" }) })

  it("answers the health check", async () => { expect((await json(await health(req("/api/v1/health")))).body.data.status).toBe("ok") })

  it("wraps every response in { data } and tags it with a request id", async () => {
    const r = await json(await listProducts(req("/api/v1/products")))
    expect(r.status).toBe(200); expect(r.body.data.total).toBe(1); expect(r.headers.get("x-request-id")).toBeTruthy()
    expect(r.headers.get("cache-control")).toContain("s-maxage") // anonymous catalog reads are CDN-cacheable
  })

  it("returns 404 for unknown and unpublished products, in the standard error shape", async () => {
    for (const slug of ["nope", "hidden"]) {
      const r = await json(await getProduct(req(`/api/v1/products/${slug}`), ctx({ slug })))
      expect(r.status).toBe(404); expect(r.body.error).toMatchObject({ code: "NOT_FOUND" }); expect(r.body.requestId).toBeTruthy()
    }
  })

  it("validates query strings (422 with field details) and never 500s on garbage", async () => {
    const bad = await json(await listProducts(req("/api/v1/products?sort=banana&page=-3")))
    expect(bad.status).toBe(422); expect(bad.body.error.code).toBe("VALIDATION_FAILED"); expect(bad.body.error.details.length).toBeGreaterThan(0)
    expect((await json(await listProducts(req("/api/v1/products?q=%25_%5C'%3B--")))).status).toBe(200)
  })

  it("lists categories", async () => { expect((await json(await categories(req("/api/v1/categories")))).body.data.map((c: any) => c.slug)).toEqual(["electronics", "fashion"]) })

  it("requires a session for personal endpoints", async () => {
    const r = await json(await me(req("/api/v1/me")))
    expect(r.status).toBe(401); expect(r.body.error.code).toBe("UNAUTHENTICATED")
    expect(r.headers.get("cache-control")).toBe("no-store")
  })

  it("returns the signed-in user, never exposing a password hash", async () => {
    const u = await signUp()
    const r = await json(await me(req("/api/v1/me", { cookie: u.cookie })))
    expect(r.status).toBe(200); expect(r.body.data).toMatchObject({ email: u.email, role: "customer" })
    expect(JSON.stringify(r.body)).not.toMatch(/password|argon2/i)
  })

  it("cannot self-assign a role at sign-up", async () => {
    const { auth } = await import("../../lib/auth")
    const res = await auth.api.signUpEmail({ body: { email: "sneaky@example.com", password: "correct-horse-battery", name: "Sneaky", role: "owner" } as never })
    expect((res.user as { role?: string }).role).toBe("customer")
  })

  describe("reviews", () => {
    const body = { rating: 5, title: "Lovely kettle", body: "Boils fast, looks great and feels solid in the hand." }
    it("needs sign-in, stores the review as pending and keeps it out of the public list", async () => {
      expect((await json(await postReview(req("/api/v1/products/kettle/reviews", { method: "POST", body }), ctx({ slug: "kettle" })))).status).toBe(401)
      const u = await signUp()
      const r = await json(await postReview(req("/api/v1/products/kettle/reviews", { method: "POST", body, cookie: u.cookie }), ctx({ slug: "kettle" })))
      expect(r.status).toBe(201); expect(r.body.data).toMatchObject({ status: "pending", verifiedPurchase: false })
      const list = await json(await listReviews(req("/api/v1/products/kettle/reviews"), ctx({ slug: "kettle" })))
      expect(list.body.data.items).toEqual([]); expect(list.body.data.summary.count).toBe(0)
      const dup = await json(await postReview(req("/api/v1/products/kettle/reviews", { method: "POST", body, cookie: u.cookie }), ctx({ slug: "kettle" })))
      expect(dup.status).toBe(409); expect(dup.body.error.code).toBe("ALREADY_REVIEWED")
    })
    it("rejects short bodies with field errors", async () => {
      const u = await signUp()
      const r = await json(await postReview(req("/api/v1/products/kettle/reviews", { method: "POST", body: { ...body, body: "short" }, cookie: u.cookie }), ctx({ slug: "kettle" })))
      expect(r.status).toBe(422); expect(r.body.error.details[0].path).toBe("body")
    })
  })

  describe("request hardening", () => {
    const body = { rating: 5, title: "Lovely kettle", body: "Boils fast, looks great and feels solid in the hand." }
    it("blocks cross-site state-changing requests", async () => {
      const u = await signUp()
      const r = await json(await postReview(req("/api/v1/products/kettle/reviews", { method: "POST", body, cookie: u.cookie, origin: "https://evil.example" }), ctx({ slug: "kettle" })))
      expect(r.status).toBe(403); expect(r.body.error.code).toBe("BAD_ORIGIN")
    })
    it("rejects non-JSON and malformed bodies", async () => {
      const u = await signUp()
      const plain = new Request("http://localhost:3000/api/v1/products/kettle/reviews", { method: "POST", headers: { cookie: u.cookie, origin: "http://localhost:3000", "content-type": "text/plain" }, body: "hi" })
      expect((await json(await postReview(plain, ctx({ slug: "kettle" })))).status).toBe(415)
      const broken = new Request("http://localhost:3000/api/v1/products/kettle/reviews", { method: "POST", headers: { cookie: u.cookie, origin: "http://localhost:3000", "content-type": "application/json" }, body: "{oops" })
      const r = await json(await postReview(broken, ctx({ slug: "kettle" }))); expect(r.status).toBe(400); expect(r.body.error.code).toBe("INVALID_JSON")
    })
    it("ignores a forged or expired session cookie", async () => {
      expect((await json(await me(req("/api/v1/me", { cookie: "sk.session_token=forged.value" })))).status).toBe(401)
    })
  })

  it("previews a coupon with database prices, and explains an invalid one", async () => {
    const p = (await json(await getProduct(req("/api/v1/products/kettle"), ctx({ slug: "kettle" })))).body.data
    await makeCoupon({ code: "TEN", value: 10 })
    const good = await json(await validateCoupon(req("/api/v1/coupons/validate", { method: "POST", body: { code: "ten", items: [{ productId: p.id, quantity: 1 }] } })))
    expect(good.body.data).toMatchObject({ valid: true, code: "TEN", totals: { discountPaise: 15000, totalPaise: 135000 } })
    const bad = await json(await validateCoupon(req("/api/v1/coupons/validate", { method: "POST", body: { code: "zzz", items: [{ productId: p.id, quantity: 1 }] } })))
    expect(bad.body.data).toMatchObject({ valid: false })
  })
})
