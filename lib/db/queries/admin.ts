import "server-only"

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"

import { db } from "../index"
import { auditEvents, banners, brands, categories, coupons, orderItems, orders, productImages, products, returns, stockLevels, taxCategories, users } from "../schema"
import { DomainError } from "./errors"

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)
const audit = (tx: Pick<typeof db, "insert">, actorId: string | null, action: string, entity: string, entityId: string, before: unknown, after: unknown) =>
  tx.insert(auditEvents).values({ actorId, action, entity, entityId, before: before as never, after: after as never })

// ---------------------------------------------------------------- products
export type ProductInput = {
  title: string; slug: string; sku: string; description: string; categoryId: string; brandId: string; taxCategoryId: string
  pricePaise: number; comparePaise?: number | null; badge?: string | null; status: "draft" | "published" | "archived"
  seoTitle?: string; seoDescription?: string; images?: { url: string; alt?: string }[]; initialStock?: number; reorderAt?: number
}

export async function listProductsForAdmin(p: { q?: string; status?: string; page?: number; pageSize?: number }) {
  const pageSize = Math.min(Math.max(p.pageSize ?? 20, 1), 100), page = Math.max(p.page ?? 1, 1)
  const where = and(p.status ? eq(products.status, p.status as never) : undefined, p.q ? or(ilike(products.title, `%${escapeLike(p.q)}%`), ilike(products.sku, `%${escapeLike(p.q)}%`)) : undefined)
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(products).where(where)
  const items = await db.select({ id: products.id, title: products.title, slug: products.slug, sku: products.sku, status: products.status, pricePaise: products.pricePaise, onHand: sql<number>`coalesce(${stockLevels.onHand}, 0)`, reserved: sql<number>`coalesce(${stockLevels.reserved}, 0)`, updatedAt: products.updatedAt })
    .from(products).leftJoin(stockLevels, eq(stockLevels.productId, products.id)).where(where).orderBy(desc(products.updatedAt), asc(products.id)).limit(pageSize).offset((page - 1) * pageSize)
  return { items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function createProduct(input: ProductInput, actorId: string | null) {
  return db.transaction(async (tx) => {
    const { images, initialStock = 0, reorderAt = 10, ...values } = input
    const [row] = await tx.insert(products).values({ ...values, comparePaise: values.comparePaise ?? null, badge: values.badge ?? null }).returning()
    await tx.insert(stockLevels).values({ productId: row.id, onHand: initialStock, reorderAt })
    if (images?.length) await tx.insert(productImages).values(images.map((i, position) => ({ productId: row.id, url: i.url, alt: i.alt ?? "", position })))
    await audit(tx, actorId, "product.create", "product", row.id, null, { sku: row.sku, title: row.title })
    return row
  })
}

export async function updateProduct(id: string, patch: Partial<Omit<ProductInput, "initialStock" | "images">> & { images?: ProductInput["images"] }, actorId: string | null) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(products).where(eq(products.id, id)).for("update")
    if (!before) throw new DomainError("NOT_FOUND", "Product not found.")
    const { images, ...values } = patch
    const defined = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined))
    const [row] = Object.keys(defined).length ? await tx.update(products).set(defined).where(eq(products.id, id)).returning() : [before]
    if (images) {
      await tx.delete(productImages).where(eq(productImages.productId, id))
      if (images.length) await tx.insert(productImages).values(images.map((i, position) => ({ productId: id, url: i.url, alt: i.alt ?? "", position })))
    }
    await audit(tx, actorId, "product.update", "product", id, { price: before.pricePaise, status: before.status }, { price: row.pricePaise, status: row.status })
    return row
  })
}

/** Products that have been ordered are archived, never deleted, so order history stays intact. */
export async function archiveProduct(id: string, actorId: string | null) {
  return updateProduct(id, { status: "archived" }, actorId)
}

export async function listTaxCategories() { return db.select().from(taxCategories).orderBy(asc(taxCategories.ratePercent)) }

// ---------------------------------------------------------------- orders
export async function listOrdersForAdmin(p: { status?: string; q?: string; page?: number; pageSize?: number }) {
  const pageSize = Math.min(Math.max(p.pageSize ?? 20, 1), 100), page = Math.max(p.page ?? 1, 1)
  const q = p.q?.trim()
  const where = and(p.status ? eq(orders.status, p.status as never) : undefined, q ? or(ilike(orders.number, `%${escapeLike(q)}%`), ilike(orders.customerName, `%${escapeLike(q)}%`), ilike(orders.customerEmail, `%${escapeLike(q)}%`)) : undefined)
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(orders).where(where)
  const items = await db.select({ id: orders.id, number: orders.number, status: orders.status, totalPaise: orders.totalPaise, customerName: orders.customerName, customerEmail: orders.customerEmail, placedAt: orders.placedAt, itemCount: sql<number>`(select coalesce(sum(quantity), 0)::int from ${orderItems} where ${orderItems.orderId} = ${orders.id})` })
    .from(orders).where(where).orderBy(desc(orders.placedAt), asc(orders.id)).limit(pageSize).offset((page - 1) * pageSize)
  return { items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

// ---------------------------------------------------------------- customers
export async function listCustomers(p: { q?: string; page?: number; pageSize?: number }) {
  const pageSize = Math.min(Math.max(p.pageSize ?? 20, 1), 100), page = Math.max(p.page ?? 1, 1)
  const where = and(eq(users.role, "customer"), p.q ? or(ilike(users.name, `%${escapeLike(p.q)}%`), ilike(users.email, `%${escapeLike(p.q)}%`)) : undefined)
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(users).where(where)
  const items = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, createdAt: users.createdAt,
    orderCount: sql<number>`(select count(*)::int from ${orders} where ${orders.userId} = ${users.id} and ${orders.status} not in ('pending', 'cancelled'))`,
    spentPaise: sql<number>`(select coalesce(sum(${orders.totalPaise}), 0)::int from ${orders} where ${orders.userId} = ${users.id} and ${orders.status} in ('paid', 'packed', 'shipped', 'delivered'))` })
    .from(users).where(where).orderBy(desc(users.createdAt), asc(users.id)).limit(pageSize).offset((page - 1) * pageSize)
  return { items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

// ---------------------------------------------------------------- coupons
export type CouponInput = { code: string; kind: "percent" | "flat"; value: number; minOrderPaise?: number; usageLimit: number; startsAt?: Date | null; expiresAt: Date; isActive?: boolean }
export const listCoupons = () => db.select().from(coupons).orderBy(desc(coupons.createdAt))
export async function createCoupon(input: CouponInput, actorId: string | null) {
  const [c] = await db.insert(coupons).values({ ...input, code: input.code.trim().toUpperCase(), minOrderPaise: input.minOrderPaise ?? 0, startsAt: input.startsAt ?? null }).returning()
  await audit(db, actorId, "coupon.create", "coupon", c.id, null, { code: c.code })
  return c
}
export async function updateCoupon(id: string, patch: Partial<CouponInput>, actorId: string | null) {
  const values = Object.fromEntries(Object.entries({ ...patch, code: patch.code?.trim().toUpperCase() }).filter(([, v]) => v !== undefined))
  const [c] = await db.update(coupons).set(values).where(eq(coupons.id, id)).returning()
  if (!c) throw new DomainError("NOT_FOUND", "Coupon not found.")
  await audit(db, actorId, "coupon.update", "coupon", id, null, values)
  return c
}

// ---------------------------------------------------------------- banners
export type BannerInput = { title: string; slot: "home_hero" | "home_promo_grid" | "category_banner" | "cart_banner"; startsAt: Date; endsAt: Date; href: string; isPaused?: boolean }
export const listBanners = () => db.select().from(banners).orderBy(desc(banners.startsAt))
export async function createBanner(input: BannerInput) { return (await db.insert(banners).values(input).returning())[0] }
export async function updateBanner(id: string, patch: Partial<BannerInput>) {
  const values = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
  const [b] = await db.update(banners).set(values).where(eq(banners.id, id)).returning()
  if (!b) throw new DomainError("NOT_FOUND", "Banner not found.")
  return b
}
export async function deleteBanner(id: string) { await db.delete(banners).where(eq(banners.id, id)) }

// ---------------------------------------------------------------- returns
export const listReturns = (status?: string) => db.select().from(returns).where(status ? eq(returns.status, status as never) : undefined).orderBy(desc(returns.createdAt))
const RETURN_FLOW: Record<string, string[]> = { requested: ["approved", "rejected"], approved: ["received", "rejected"], received: ["refunded"] }
export async function setReturnStatus(id: string, to: "approved" | "received" | "refunded" | "rejected", actorId: string | null) {
  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(returns).where(eq(returns.id, id)).for("update")
    if (!r) throw new DomainError("NOT_FOUND", "Return not found.")
    if (!(RETURN_FLOW[r.status] ?? []).includes(to)) throw new DomainError("INVALID_TRANSITION", `A return that is ${r.status} can't move to ${to}.`)
    const [row] = await tx.update(returns).set({ status: to }).where(eq(returns.id, id)).returning()
    await audit(tx, actorId, "return.status", "return", id, { status: r.status }, { status: to })
    return row
  })
}

// ---------------------------------------------------------------- dashboard
export async function dashboardSummary(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000)
  const [t] = await db.select({ revenue: sql<number>`coalesce(sum(${orders.totalPaise}) filter (where ${orders.status} in ('paid','packed','shipped','delivered')), 0)::int`, orders: sql<number>`count(*) filter (where ${orders.status} not in ('pending','cancelled'))::int`, pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`, toShip: sql<number>`count(*) filter (where ${orders.status} in ('paid','packed'))::int` }).from(orders).where(sql`${orders.placedAt} >= ${since}`)
  const daily = await db.select({ day: sql<string>`to_char(date_trunc('day', ${orders.placedAt} at time zone 'Asia/Kolkata'), 'YYYY-MM-DD')`, revenue: sql<number>`coalesce(sum(${orders.totalPaise}), 0)::int`, orders: sql<number>`count(*)::int` }).from(orders).where(and(sql`${orders.placedAt} >= ${since}`, inArray(orders.status, ["paid", "packed", "shipped", "delivered"]))).groupBy(sql`1`).orderBy(sql`1`)
  const top = await db.select({ productId: orderItems.productId, title: sql<string>`max(${orderItems.title})`, units: sql<number>`sum(${orderItems.quantity})::int`, revenuePaise: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPricePaise})::int` }).from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).where(and(sql`${orders.placedAt} >= ${since}`, inArray(orders.status, ["paid", "packed", "shipped", "delivered"]))).groupBy(orderItems.productId).orderBy(sql`sum(${orderItems.quantity}) desc`).limit(5)
  return { days, ...t, aovPaise: t.orders ? Math.round(t.revenue / t.orders) : 0, daily, topProducts: top }
}

export async function listRefs() {
  const [c, b, t] = await Promise.all([db.select().from(categories).orderBy(asc(categories.sortOrder)), db.select().from(brands).orderBy(asc(brands.name)), listTaxCategories()])
  return { categories: c, brands: b, taxCategories: t }
}
