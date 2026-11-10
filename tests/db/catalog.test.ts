import { beforeEach, describe, expect, it } from "vitest"

import { facetCounts, getProductBySlug, getProductsByIds, listBrands, listCategories, relatedProducts, searchProducts } from "../../lib/db/queries"
import { makeCatalog, makeProduct, resetDb } from "../helpers"

describe("catalog queries", () => {
  let cat: Awaited<ReturnType<typeof makeCatalog>>
  beforeEach(async () => {
    await resetDb(); cat = await makeCatalog()
    await makeProduct(cat, { title: "Wireless Earbuds Pro", slug: "earbuds", pricePaise: 250000, comparePaise: 400000, ratingCount: 100, ratingSum: 460, stock: 20 })
    await makeProduct(cat, { title: "Wired Headphones", slug: "headphones", pricePaise: 150000, ratingCount: 50, ratingSum: 200, brandId: cat.zen.id, stock: 0 })
    await makeProduct(cat, { title: "Cotton Shirt", slug: "shirt", categoryId: cat.fashion.id, taxCategoryId: cat.tax12.id, pricePaise: 80000, comparePaise: 100000, ratingCount: 10, ratingSum: 49, stock: 5 })
    await makeProduct(cat, { title: "Secret Draft", slug: "draft", status: "draft" })
    await makeProduct(cat, { title: "Old Archived", slug: "archived", status: "archived" })
  })

  it("lists only published products", async () => {
    const r = await searchProducts({ sort: "price-asc", pageSize: 20 })
    expect(r.total).toBe(3)
    expect(r.items.map((p) => p.slug)).toEqual(["shirt", "headphones", "earbuds"])
  })

  it("returns a complete product: brand, category, GST, rating and available stock", async () => {
    const p = (await getProductBySlug("earbuds"))!
    expect(p).toMatchObject({ title: "Wireless Earbuds Pro", pricePaise: 250000, comparePaise: 400000, gstPercent: 18, rating: 4.6, ratingCount: 100, available: 20 })
    expect(p.brand.slug).toBe("acme"); expect(p.category.slug).toBe("electronics")
    expect((await getProductBySlug("shirt"))!.gstPercent).toBe(12)
  })

  it("hides drafts and archived products from the public lookups", async () => {
    expect(await getProductBySlug("draft")).toBeNull()
    expect(await getProductBySlug("archived")).toBeNull()
    expect((await getProductBySlug("draft", { includeUnpublished: true }))?.status).toBe("draft")
  })

  it("finds products by full-text search and by brand name", async () => {
    expect((await searchProducts({ q: "earbuds" })).items.map((p) => p.slug)).toEqual(["earbuds"])
    expect((await searchProducts({ q: "wired" })).items.map((p) => p.slug)).toEqual(["headphones"])
    expect((await searchProducts({ q: "zen" })).items.map((p) => p.slug)).toEqual(["headphones"])
    expect((await searchProducts({ q: "nothing-like-this" })).total).toBe(0)
    expect((await searchProducts({ q: "50%_" })).total).toBe(0) // LIKE wildcards in input are escaped, not interpreted
  })

  it("filters by category, brand, price, stock, rating and discount", async () => {
    expect((await searchProducts({ category: "fashion" })).items.map((p) => p.slug)).toEqual(["shirt"])
    expect((await searchProducts({ brands: ["Zen"] })).items.map((p) => p.slug)).toEqual(["headphones"])
    expect((await searchProducts({ minPaise: 100000, maxPaise: 200000 })).items.map((p) => p.slug)).toEqual(["headphones"])
    expect((await searchProducts({ inStock: true, sort: "price-asc" })).items.map((p) => p.slug)).toEqual(["shirt", "earbuds"])
    expect((await searchProducts({ rating: 4.5, sort: "price-asc" })).items.map((p) => p.slug)).toEqual(["shirt", "earbuds"])
    expect((await searchProducts({ discount: 25 })).items.map((p) => p.slug)).toEqual(["earbuds"])
  })

  it("sorts by rating, price and discount", async () => {
    expect((await searchProducts({ sort: "rating" })).items.map((p) => p.slug)).toEqual(["shirt", "earbuds", "headphones"])
    expect((await searchProducts({ sort: "price-desc" })).items.map((p) => p.slug)).toEqual(["earbuds", "headphones", "shirt"])
    expect((await searchProducts({ sort: "discount" })).items[0].slug).toBe("earbuds")
  })

  it("paginates and clamps the page number", async () => {
    const r = await searchProducts({ sort: "price-asc", pageSize: 2, page: 2 })
    expect(r).toMatchObject({ total: 3, pages: 2, page: 2 }); expect(r.items.map((p) => p.slug)).toEqual(["earbuds"])
    expect((await searchProducts({ pageSize: 2, page: 99 })).page).toBe(2)
  })

  it("counts facets using every other active filter", async () => {
    const f = await facetCounts({ brands: ["Acme"] })
    expect(f.categories).toEqual({ electronics: 1, fashion: 1 }) // category counts ignore the category filter itself
    const g = await facetCounts({ category: "electronics" })
    expect(g.brands).toEqual({ Acme: 1, Zen: 1 })
  })

  it("lists categories and brands with published counts, and loads products by id in order", async () => {
    expect((await listCategories()).map((c) => [c.slug, c.count])).toEqual([["electronics", 2], ["fashion", 1]])
    expect((await listBrands()).map((b) => [b.name, b.count])).toEqual([["Acme", 2], ["Zen", 1]])
    const all = (await searchProducts({ pageSize: 20 })).items
    const ids = [all[2].id, all[0].id]
    expect((await getProductsByIds(ids)).map((p) => p.id)).toEqual(ids)
  })

  it("suggests related products from the same category first", async () => {
    const earbuds = (await getProductBySlug("earbuds"))!
    const rel = await relatedProducts(earbuds.id, 5)
    expect(rel.map((p) => p.slug)).toEqual(["headphones", "shirt"])
  })
})
