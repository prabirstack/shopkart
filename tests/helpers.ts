import { sql } from "drizzle-orm"

import { db } from "../lib/db"
import * as s from "../lib/db/schema"

const TABLES = "verifications, accounts, audit_events, settings, wishlist_items, reviews, article_products, articles, banners, coupon_redemptions, webhook_events, payments, order_events, order_items, returns, orders, coupons, stock_movements, stock_levels, product_images, products, tax_categories, categories, brands, sessions, addresses, users"

/** Empties every table so each test starts from a known state. */
export async function resetDb() {
  await db.execute(sql.raw(`TRUNCATE TABLE ${TABLES} RESTART IDENTITY CASCADE`))
}

let seq = 0
const next = () => ++seq

export async function makeCatalog() {
  const [tax18] = await db.insert(s.taxCategories).values({ name: "GST 18%", ratePercent: 18 }).returning()
  const [tax12] = await db.insert(s.taxCategories).values({ name: "GST 12%", ratePercent: 12 }).returning()
  const [electronics] = await db.insert(s.categories).values({ name: "Electronics", shortName: "Electronics", slug: "electronics", sortOrder: 0 }).returning()
  const [fashion] = await db.insert(s.categories).values({ name: "Fashion", shortName: "Fashion", slug: "fashion", sortOrder: 1 }).returning()
  const [acme] = await db.insert(s.brands).values({ name: "Acme", slug: "acme" }).returning()
  const [zen] = await db.insert(s.brands).values({ name: "Zen", slug: "zen" }).returning()
  return { tax18, tax12, electronics, fashion, acme, zen }
}

type Cat = Awaited<ReturnType<typeof makeCatalog>>

export async function makeProduct(cat: Cat, o: Partial<typeof s.products.$inferInsert> & { stock?: number; reserved?: number } = {}) {
  const n = next()
  const { stock = 10, reserved = 0, ...rest } = o
  const [p] = await db.insert(s.products).values({
    categoryId: cat.electronics.id, brandId: cat.acme.id, taxCategoryId: cat.tax18.id, title: `Product ${n}`, slug: `product-${n}`, sku: `SKU-${n}`,
    description: `A very useful product number ${n}`, pricePaise: 100000, status: "published", ...rest,
  }).returning()
  await db.insert(s.stockLevels).values({ productId: p.id, onHand: stock, reserved, reorderAt: 5 })
  return p
}

export async function makeUser(o: Partial<typeof s.users.$inferInsert> = {}) {
  const n = next()
  const [u] = await db.insert(s.users).values({ email: `user${n}@example.com`, name: `User ${n}`, phone: `98000000${String(n).padStart(2, "0")}`, ...o }).returning()
  return u
}

export const address = { name: "Test User", phone: "9800000001", line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" }
export const customer = { name: "Test User", email: "test@example.com", phone: "9800000001" }

export async function makeCoupon(o: Partial<typeof s.coupons.$inferInsert> = {}) {
  const n = next()
  const [c] = await db.insert(s.coupons).values({ code: `SAVE${n}`, kind: "percent", value: 10, usageLimit: 100, expiresAt: new Date(Date.now() + 86_400_000), ...o }).returning()
  return c
}

export const stockOf = async (productId: string) => (await db.select().from(s.stockLevels).where(sql`product_id = ${productId}`))[0]
