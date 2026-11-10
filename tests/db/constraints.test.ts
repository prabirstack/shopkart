import { beforeEach, describe, expect, it } from "vitest"
import { sql } from "drizzle-orm"

import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { pgCode } from "../../lib/db/queries"
import { makeCatalog, makeCoupon, makeProduct, makeUser, resetDb } from "../helpers"

// These rules live in the database itself, so no code path (or a hand-written SQL fix) can break them.
const code = async (p: Promise<unknown>) => { try { await p; return undefined } catch (e) { return pgCode(e) } }

describe("database constraints", () => {
  let cat: Awaited<ReturnType<typeof makeCatalog>>
  beforeEach(async () => { await resetDb(); cat = await makeCatalog() })

  it("rejects a product priced at zero, and a compare-at price that is not higher", async () => {
    expect(await code(makeProduct(cat, { pricePaise: 0 }))).toBe("23514")
    expect(await code(makeProduct(cat, { pricePaise: 5000, comparePaise: 5000 }))).toBe("23514")
    expect(await code(makeProduct(cat, { pricePaise: 5000, comparePaise: 9000 }))).toBeUndefined()
  })

  it("never lets stock go negative or reserved exceed on hand", async () => {
    const p = await makeProduct(cat, { stock: 3 })
    expect(await code(db.update(s.stockLevels).set({ onHand: -1 }).where(sql`product_id = ${p.id}`))).toBe("23514")
    expect(await code(db.update(s.stockLevels).set({ reserved: 4 }).where(sql`product_id = ${p.id}`))).toBe("23514")
  })

  it("only allows real GST rates", async () => {
    expect(await code(db.insert(s.taxCategories).values({ name: "GST 7%", ratePercent: 7 }))).toBe("23514")
  })

  it("keeps slugs, SKUs and brand names unique", async () => {
    await makeProduct(cat, { slug: "same", sku: "SKU-UNIQUE" })
    expect(await code(makeProduct(cat, { slug: "same" }))).toBe("23505")
    expect(await code(makeProduct(cat, { sku: "SKU-UNIQUE" }))).toBe("23505")
    expect(await code(db.insert(s.brands).values({ name: "ACME", slug: "acme-2" }))).toBe("23505") // case-insensitive
  })

  it("rejects an order whose total does not add up", async () => {
    const u = await makeUser()
    const base = { userId: u.id, customerName: "A", customerEmail: "a@x.com", customerPhone: "1", shipTo: { name: "A", phone: "1", line1: "x", city: "y", state: "z", pincode: "560001" } }
    expect(await code(db.insert(s.orders).values({ ...base, subtotalPaise: 1000, discountPaise: 0, shippingPaise: 0, totalPaise: 999 }))).toBe("23514")
    expect(await code(db.insert(s.orders).values({ ...base, subtotalPaise: 1000, discountPaise: 0, shippingPaise: 0, totalPaise: 1000 }))).toBeUndefined()
  })

  it("allows only one captured payment per order", async () => {
    const u = await makeUser()
    const [o] = await db.insert(s.orders).values({ userId: u.id, customerName: "A", customerEmail: "a@x.com", customerPhone: "1", shipTo: { name: "A", phone: "1", line1: "x", city: "y", state: "z", pincode: "560001" }, subtotalPaise: 1000, totalPaise: 1000 }).returning()
    await db.insert(s.payments).values({ orderId: o.id, providerOrderId: "o1", providerPaymentId: "p1", amountPaise: 1000, status: "captured" })
    expect(await code(db.insert(s.payments).values({ orderId: o.id, providerOrderId: "o2", providerPaymentId: "p2", amountPaise: 1000, status: "captured" }))).toBe("23505")
    expect(await code(db.insert(s.payments).values({ orderId: o.id, providerOrderId: "o3", amountPaise: 1000, status: "failed" }))).toBeUndefined()
  })

  it("validates coupons: uppercase code, sensible value, usage within the limit", async () => {
    expect(await code(makeCoupon({ code: "lower" }))).toBe("23514")
    expect(await code(makeCoupon({ kind: "percent", value: 95 }))).toBe("23514")
    expect(await code(makeCoupon({ usageLimit: 5, usedCount: 6 }))).toBe("23514")
    expect(await code(makeCoupon({ kind: "flat", value: 20000 }))).toBeUndefined()
  })

  it("keeps reviews to 1 to 5 stars and one per customer per product", async () => {
    const p = await makeProduct(cat); const u = await makeUser()
    const r = { productId: p.id, authorName: "Neha", title: "Great value", body: "Works well and arrived on time, very happy." }
    expect(await code(db.insert(s.reviews).values({ ...r, rating: 6 }))).toBe("23514")
    expect(await code(db.insert(s.reviews).values({ ...r, rating: 5, userId: u.id }))).toBeUndefined()
    expect(await code(db.insert(s.reviews).values({ ...r, rating: 4, userId: u.id }))).toBe("23505")
    expect(await code(db.insert(s.reviews).values({ ...r, rating: 4 }))).toBeUndefined() // anonymous rows are exempt
  })
})
