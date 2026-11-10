import { beforeEach, describe, expect, it } from "vitest"

import { GET as byIds } from "../../app/api/v1/products/by-ids/route"
import { GET as suggest } from "../../app/api/v1/search/suggest/route"
import { makeCatalog, makeProduct, resetDb } from "../helpers"
import { json, req } from "./helpers"

describe("storefront browsing APIs", () => {
  let cat: Awaited<ReturnType<typeof makeCatalog>>
  let kettle: Awaited<ReturnType<typeof makeProduct>>
  let draft: Awaited<ReturnType<typeof makeProduct>>
  beforeEach(async () => {
    await resetDb()
    cat = await makeCatalog()
    kettle = await makeProduct(cat, { slug: "steel-kettle", title: "Steel Kettle", pricePaise: 150000, comparePaise: 200000 })
    draft = await makeProduct(cat, { slug: "secret-kettle", title: "Secret Kettle", status: "draft" })
  })

  describe("GET /api/v1/products/by-ids", () => {
    it("returns plain products in the order asked, with no component fields", async () => {
      const other = await makeProduct(cat, { slug: "toaster", title: "Toaster" })
      const r = await json(await byIds(req(`/api/v1/products/by-ids?ids=${other.id},${kettle.id}`)))
      expect(r.status).toBe(200)
      expect(r.body.data.map((p: { slug: string }) => p.slug)).toEqual(["toaster", "steel-kettle"])
      expect(r.body.data[1]).toMatchObject({ id: kettle.id, category: "electronics", brand: "Acme", pricePaise: 150000, comparePaise: 200000, stock: 10 })
      expect(r.body.data[1]).not.toHaveProperty("icon")
      expect(r.headers.get("cache-control")).toContain("s-maxage")
    })

    it("skips unknown and unpublished ids", async () => {
      const unknown = "00000000-0000-4000-8000-000000000000"
      const r = await json(await byIds(req(`/api/v1/products/by-ids?ids=${unknown},${draft.id},${kettle.id}`)))
      expect(r.status).toBe(200)
      expect(r.body.data.map((p: { id: string }) => p.id)).toEqual([kettle.id])
    })

    it("rejects malformed ids and a missing list with 422", async () => {
      for (const path of ["/api/v1/products/by-ids?ids=nope", `/api/v1/products/by-ids?ids=${kettle.id},123`, "/api/v1/products/by-ids?ids=", "/api/v1/products/by-ids"]) {
        const r = await json(await byIds(req(path)))
        expect(r.status, path).toBe(422)
        expect(r.body.error.code).toBe("VALIDATION_FAILED")
      }
    })

    it("accepts at most 50 ids", async () => {
      const ids = (n: number) => Array.from({ length: n }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`).join(",")
      expect((await json(await byIds(req(`/api/v1/products/by-ids?ids=${ids(50)}`)))).status).toBe(200)
      expect((await json(await byIds(req(`/api/v1/products/by-ids?ids=${ids(51)}`)))).status).toBe(422)
    })

    it("ignores duplicate ids", async () => {
      const r = await json(await byIds(req(`/api/v1/products/by-ids?ids=${kettle.id},${kettle.id}`)))
      expect(r.body.data).toHaveLength(1)
    })
  })

  describe("GET /api/v1/search/suggest", () => {
    it("returns products, categories and brands", async () => {
      const r = await json(await suggest(req("/api/v1/search/suggest?q=kettle")))
      expect(r.status).toBe(200)
      expect(Object.keys(r.body.data).sort()).toEqual(["brands", "categories", "products"])
      expect(r.body.data.products.map((p: { slug: string }) => p.slug)).toEqual(["steel-kettle"]) // the draft never shows
      expect(r.body.data.products[0]).toMatchObject({ id: kettle.id, title: "Steel Kettle", pricePaise: 150000 })
      expect(r.headers.get("cache-control")).toContain("s-maxage")
    })

    it("matches category and brand names", async () => {
      const r = await json(await suggest(req("/api/v1/search/suggest?q=electr")))
      expect(r.body.data.categories).toEqual([{ slug: "electronics", name: "Electronics" }])
      const b = await json(await suggest(req("/api/v1/search/suggest?q=acm")))
      expect(b.body.data.brands).toEqual(["Acme"])
    })

    it("copes with a typo", async () => {
      const r = await json(await suggest(req("/api/v1/search/suggest?q=ketle")))
      expect(r.body.data.products.map((p: { slug: string }) => p.slug)).toContain("steel-kettle")
    })

    it("returns nothing for a one-letter query and for no match", async () => {
      for (const q of ["k", "zzzzqqqq"]) {
        const r = await json(await suggest(req(`/api/v1/search/suggest?q=${q}`)))
        expect(r.status).toBe(200)
        expect(r.body.data).toEqual({ products: [], categories: [], brands: [] })
      }
    })

    it("survives wildcard and quote characters, and rejects an over-long query", async () => {
      expect((await json(await suggest(req("/api/v1/search/suggest?q=%25_%5C'%3B--")))).status).toBe(200)
      expect((await json(await suggest(req(`/api/v1/search/suggest?q=${"a".repeat(81)}`)))).status).toBe(422)
    })
  })
})
