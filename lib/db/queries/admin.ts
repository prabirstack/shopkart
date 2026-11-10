import "server-only"

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"

import { db } from "../index"
import { auditEvents, banners, brands, categories, coupons, orderItems, orderNotes, orders, payments, productImages, products, returnItems, returns, stockLevels, stockMovements, taxCategories, users } from "../schema"
import { formatMoney } from "@/lib/money"
import { DomainError, isInUse } from "./errors"
import { assertMediaExists, deleteUnreferencedMedia } from "./media"

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)
const audit = (tx: Pick<typeof db, "insert">, actorId: string | null, action: string, entity: string, entityId: string, before: unknown, after: unknown) =>
  tx.insert(auditEvents).values({ actorId, action, entity, entityId, before: before as never, after: after as never })

// ---------------------------------------------------------------- products
export async function listProductsForAdmin(p: { q?: string; status?: string; page?: number; pageSize?: number }) {
  const pageSize = Math.min(Math.max(p.pageSize ?? 20, 1), 100), page = Math.max(p.page ?? 1, 1)
  const where = and(p.status ? eq(products.status, p.status as never) : undefined, p.q ? or(ilike(products.title, `%${escapeLike(p.q)}%`), ilike(products.sku, `%${escapeLike(p.q)}%`)) : undefined)
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(products).where(where)
  const items = await db.select({ id: products.id, title: products.title, slug: products.slug, sku: products.sku, status: products.status, pricePaise: products.pricePaise, onHand: sql<number>`coalesce(${stockLevels.onHand}, 0)`, reserved: sql<number>`coalesce(${stockLevels.reserved}, 0)`, updatedAt: products.updatedAt })
    .from(products).leftJoin(stockLevels, eq(stockLevels.productId, products.id)).where(where).orderBy(desc(products.updatedAt), asc(products.id)).limit(pageSize).offset((page - 1) * pageSize)
  return { items, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

/**
 * What the admin product form sends. People think in "Electronics", "Philips" and "18%", not ids, so the
 * category is a slug, the brand a name (created when new) and GST a rate; they are resolved here, once.
 */
export type ProductInput = {
  title: string; slug: string; sku: string; description: string; categorySlug: string; brandName: string; gstPercent: number
  pricePaise: number; comparePaise?: number | null; badge?: string | null; status: "draft" | "published" | "archived"
  seoTitle?: string; seoDescription?: string; images?: ImageInput[]; initialStock?: number; reorderAt?: number
}

/** One photo of a product, in display order. Position 0 is the main image. */
export type ImageInput = { url: string; alt?: string; width?: number | null; height?: number | null }
const imageRows = (productId: string, images: ImageInput[]) => images.map((i, position) => ({ productId, url: i.url, alt: i.alt ?? "", width: i.width ?? null, height: i.height ?? null, position }))

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function resolveRefs(tx: Tx, r: { categorySlug?: string; brandName?: string; gstPercent?: number }) {
  const out: { categoryId?: string; brandId?: string; taxCategoryId?: string } = {}
  if (r.categorySlug !== undefined) {
    const [c] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.slug, r.categorySlug))
    if (!c) throw new DomainError("INVALID_CATEGORY", "That category doesn't exist.")
    out.categoryId = c.id
  }
  if (r.brandName !== undefined) {
    const name = r.brandName.trim()
    const [existing] = await tx.select({ id: brands.id }).from(brands).where(sql`lower(${brands.name}) = ${name.toLowerCase()}`)
    if (existing) out.brandId = existing.id
    else {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand"
      const [created] = await tx.insert(brands).values({ name, slug }).onConflictDoNothing().returning({ id: brands.id })
      if (created) out.brandId = created.id
      else { const [again] = await tx.select({ id: brands.id }).from(brands).where(sql`lower(${brands.name}) = ${name.toLowerCase()} or ${brands.slug} = ${slug}`); out.brandId = again.id }
    }
  }
  if (r.gstPercent !== undefined) {
    const [t] = await tx.select({ id: taxCategories.id }).from(taxCategories).where(eq(taxCategories.ratePercent, r.gstPercent)).orderBy(asc(taxCategories.name)).limit(1)
    if (!t) throw new DomainError("INVALID_TAX", "There is no GST category with that rate.")
    out.taxCategoryId = t.id
  }
  return out
}

export async function createProduct(input: ProductInput, actorId: string | null) {
  await assertMediaExists(input.images?.map((i) => i.url) ?? [], "product")
  return db.transaction(async (tx) => {
    const { images, initialStock = 0, reorderAt = 10, categorySlug, brandName, gstPercent, ...values } = input
    const refs = await resolveRefs(tx, { categorySlug, brandName, gstPercent })
    const [row] = await tx.insert(products).values({ ...values, ...(refs as Required<typeof refs>), comparePaise: values.comparePaise ?? null, badge: values.badge ?? null }).returning()
    await tx.insert(stockLevels).values({ productId: row.id, onHand: initialStock, reorderAt })
    if (initialStock > 0) await tx.insert(stockMovements).values({ productId: row.id, delta: initialStock, reason: "correction", note: "Opening balance", actorId, reference: `opening:${row.sku}` })
    if (images?.length) await tx.insert(productImages).values(imageRows(row.id, images))
    await audit(tx, actorId, "product.create", "product", row.id, null, { sku: row.sku, title: row.title })
    return row
  })
}

export type ProductPatch = Partial<Omit<ProductInput, "initialStock" | "images">> & { images?: ProductInput["images"] }

export async function updateProduct(id: string, patch: ProductPatch, actorId: string | null) {
  if (patch.images) await assertMediaExists(patch.images.map((i) => i.url), "product")
  let removed: string[] = []
  const row = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(products).where(eq(products.id, id)).for("update")
    if (!before) throw new DomainError("NOT_FOUND", "Product not found.")
    const { images, categorySlug, brandName, gstPercent, reorderAt, ...rest } = patch
    const refs = await resolveRefs(tx, { categorySlug, brandName, gstPercent })
    const defined = Object.fromEntries(Object.entries({ ...rest, ...refs }).filter(([, v]) => v !== undefined))
    const [row] = Object.keys(defined).length ? await tx.update(products).set(defined).where(eq(products.id, id)).returning() : [before]
    if (reorderAt !== undefined) await tx.update(stockLevels).set({ reorderAt }).where(eq(stockLevels.productId, id))
    if (images) {
      // The whole set is replaced in this one transaction: reorder, alt edits, removals and additions all land together or not at all.
      const old = await tx.select({ url: productImages.url }).from(productImages).where(eq(productImages.productId, id))
      removed = old.map((o) => o.url).filter((u) => !images.some((i) => i.url === u))
      await tx.delete(productImages).where(eq(productImages.productId, id))
      if (images.length) await tx.insert(productImages).values(imageRows(id, images))
    }
    await audit(tx, actorId, "product.update", "product", id, { price: before.pricePaise, status: before.status }, { price: row.pricePaise, status: row.status })
    return row
  })
  // Files nobody references any more are deleted only now that the new set is committed.
  await deleteUnreferencedMedia(removed)
  return row
}

/** Products that have been ordered are archived, never deleted, so order history stays intact. */
export async function archiveProduct(id: string, actorId: string | null) {
  return updateProduct(id, { status: "archived" }, actorId)
}

export async function setProductsStatus(ids: string[], status: "draft" | "published" | "archived", actorId: string | null) {
  if (ids.length === 0) return { updated: 0 }
  return db.transaction(async (tx) => {
    const rows = await tx.update(products).set({ status }).where(inArray(products.id, ids)).returning({ id: products.id })
    await audit(tx, actorId, "product.bulk_status", "product", ids.join(",").slice(0, 200), null, { status, count: rows.length })
    return { updated: rows.length }
  })
}

/** Permanently removes products that were never ordered. Anything on a past order must be archived instead. */
export async function deleteProducts(ids: string[], actorId: string | null) {
  if (ids.length === 0) return { deleted: 0 }
  try {
    let urls: string[] = []
    const result = await db.transaction(async (tx) => {
      urls = (await tx.select({ url: productImages.url }).from(productImages).where(inArray(productImages.productId, ids))).map((r) => r.url)
      const rows = await tx.delete(products).where(inArray(products.id, ids)).returning({ id: products.id })
      await audit(tx, actorId, "product.delete", "product", ids.join(",").slice(0, 200), null, { count: rows.length })
      return { deleted: rows.length }
    })
    await deleteUnreferencedMedia(urls)
    return result
  } catch (e) {
    if (isInUse(e)) throw new DomainError("IN_USE", "Some of these products are on past orders, so they can't be deleted. Archive them instead.")
    throw e
  }
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

/** A private staff note on an order. */
export async function addOrderNote(number: string, body: string, actorId: string | null) {
  const [o] = await db.select({ id: orders.id }).from(orders).where(eq(orders.number, number))
  if (!o) throw new DomainError("NOT_FOUND", "Order not found.")
  const [row] = await db.insert(orderNotes).values({ orderId: o.id, authorId: actorId, body: body.trim() }).returning()
  return row
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

/** Coupons that were ever redeemed can't be deleted (their history matters). Deactivate them instead. */
export async function deleteCoupon(id: string, actorId: string | null) {
  try {
    const rows = await db.delete(coupons).where(eq(coupons.id, id)).returning({ id: coupons.id, code: coupons.code })
    if (rows.length === 0) throw new DomainError("NOT_FOUND", "Coupon not found.")
    await audit(db, actorId, "coupon.delete", "coupon", id, { code: rows[0].code }, null)
  } catch (e) {
    if (isInUse(e)) throw new DomainError("IN_USE", "This coupon has been used on orders. Deactivate it instead of deleting it.")
    throw e
  }
}

// ---------------------------------------------------------------- banners
export type BannerInput = {
  title: string; slot: "home_hero" | "home_promo_grid" | "category_banner" | "cart_banner"; startsAt: Date; endsAt: Date; href: string; isPaused?: boolean
  /** The artwork. `null` (on update) removes it; leaving it out keeps what is there. */
  image?: ImageInput | null
}
export const listBanners = () => db.select().from(banners).orderBy(desc(banners.startsAt))
/** Flattens `image` into the banner's columns. */
const bannerColumns = ({ image, ...rest }: Partial<BannerInput>) => ({
  ...rest,
  ...(image === undefined ? {} : image === null ? { imageUrl: null, imageAlt: "", imageWidth: null, imageHeight: null } : { imageUrl: image.url, imageAlt: image.alt ?? "", imageWidth: image.width ?? null, imageHeight: image.height ?? null }),
})
export async function createBanner(input: BannerInput) {
  await assertMediaExists([input.image?.url], "banner")
  return (await db.insert(banners).values(bannerColumns(input) as typeof banners.$inferInsert).returning())[0]
}
export async function updateBanner(id: string, patch: Partial<BannerInput>) {
  if (patch.image) await assertMediaExists([patch.image.url], "banner")
  const values = Object.fromEntries(Object.entries(bannerColumns(patch)).filter(([, v]) => v !== undefined))
  const [before] = await db.select({ imageUrl: banners.imageUrl }).from(banners).where(eq(banners.id, id))
  if (!before) throw new DomainError("NOT_FOUND", "Banner not found.")
  const [b] = await db.update(banners).set(values).where(eq(banners.id, id)).returning()
  if (!b) throw new DomainError("NOT_FOUND", "Banner not found.")
  if (before.imageUrl !== b.imageUrl) await deleteUnreferencedMedia([before.imageUrl])
  return b
}
export async function deleteBanner(id: string) {
  const [gone] = await db.delete(banners).where(eq(banners.id, id)).returning({ imageUrl: banners.imageUrl })
  if (gone) await deleteUnreferencedMedia([gone.imageUrl])
}

// ---------------------------------------------------------------- returns
export const listReturns = (status?: string) => db.select().from(returns).where(status ? eq(returns.status, status as never) : undefined).orderBy(desc(returns.createdAt))
const RETURN_FLOW: Record<string, string[]> = { requested: ["approved", "rejected"], approved: ["received", "rejected"], received: ["refunded"] }
type ReturnTarget = "approved" | "received" | "refunded" | "rejected"

/** Money already sent back for an order through returns that reached "refunded". */
export const refundedByReturns = async (client: Pick<typeof db, "select">, orderId: string): Promise<number> =>
  (await client.select({ n: sql<number>`coalesce(sum(${returns.refundPaise}), 0)::int` }).from(returns).where(and(eq(returns.orderId, orderId), eq(returns.status, "refunded"))))[0].n

/** Sends a return's money back through the payment gateway and returns the gateway's refund id (if any). Runs inside setReturnStatus, under the row locks. */
export type ReturnRefundGateway = (ctx: { returnId: string; number: string; orderNumber: string; refundPaise: number; payment: { providerPaymentId: string | null; amountPaise: number } | null }) => Promise<string | undefined>

/**
 * Moves a return along its flow (the status check happens under the row lock, so repeating a step is refused).
 * "received" puts the units back on the shelf in the same transaction, with one idempotent stock movement per product.
 * "refunded" only records the outcome: sending the money through the gateway is the caller's job and must come first.
 * Everything is written to the audit log.
 */
export async function setReturnStatus(id: string, to: ReturnTarget, actorId: string | null, opts: { providerRefundId?: string; gateway?: ReturnRefundGateway } = {}) {
  const [head] = await db.select({ orderId: returns.orderId }).from(returns).where(eq(returns.id, id))
  if (!head) throw new DomainError("NOT_FOUND", "Return not found.")
  return db.transaction(async (tx) => {
    // Lock the ORDER first, then the return (refundOrder locks the order too): two refunds for the same order, or a
    // double click on the same return, queue up here instead of both reaching the payment gateway.
    const [o] = await tx.select({ number: orders.number }).from(orders).where(eq(orders.id, head.orderId)).for("update")
    const [r] = await tx.select().from(returns).where(eq(returns.id, id)).for("update")
    if (!r || !o) throw new DomainError("NOT_FOUND", "Return not found.")
    if (!(RETURN_FLOW[r.status] ?? []).includes(to)) throw new DomainError("INVALID_TRANSITION", `A return that is ${r.status} can't move to ${to}.`)
    let providerRefundId = opts.providerRefundId
    if (to === "refunded") {
      const [p] = await tx.select({ providerPaymentId: payments.providerPaymentId, amountPaise: payments.amountPaise }).from(payments).where(and(eq(payments.orderId, r.orderId), inArray(payments.status, ["captured", "refunded"]))).limit(1)
      if (p) {
        const left = p.amountPaise - (await refundedByReturns(tx, r.orderId))
        if (r.refundPaise > left) throw new DomainError("NOTHING_TO_REFUND", `Only ${formatMoney(left)} is left on this payment, less than the ${formatMoney(r.refundPaise)} this return asks for.`)
      }
      // The money moves while both locks are held, so the status below can only be recorded once per return. If the
      // gateway refuses or fails, it throws, the transaction rolls back and the return stays "received".
      if (opts.gateway) providerRefundId = (await opts.gateway({ returnId: r.id, number: r.number, orderNumber: o.number, refundPaise: r.refundPaise, payment: p ?? null })) ?? providerRefundId
    }
    const restocked: { productId: string; quantity: number }[] = []
    if (to === "received") {
      const lines = await tx.select({ productId: orderItems.productId, quantity: returnItems.quantity }).from(returnItems).innerJoin(orderItems, eq(orderItems.id, returnItems.orderItemId)).where(eq(returnItems.returnId, r.id))
      const perProduct = new Map<string, number>()
      for (const l of lines) perProduct.set(l.productId, (perProduct.get(l.productId) ?? 0) + l.quantity)
      for (const [productId, quantity] of perProduct) {
        // The reference makes the movement happen once: a replay finds it already there and adds nothing.
        const done = await tx.insert(stockMovements).values({ productId, delta: quantity, reason: "return", note: `Return ${r.number}`, actorId, reference: `${r.number}:${productId}` }).onConflictDoNothing().returning({ id: stockMovements.id })
        if (done.length === 0) continue
        await tx.update(stockLevels).set({ onHand: sql`${stockLevels.onHand} + ${quantity}` }).where(eq(stockLevels.productId, productId))
        restocked.push({ productId, quantity })
      }
    }
    const [row] = await tx.update(returns).set({ status: to, ...(to === "received" ? { receivedAt: new Date() } : {}) }).where(eq(returns.id, id)).returning()
    await audit(tx, actorId, "return.status", "return", id, { status: r.status }, {
      status: to, ...(restocked.length ? { restocked } : {}), ...(to === "refunded" ? { refundPaise: r.refundPaise, ...(providerRefundId ? { providerRefundId } : {}) } : {}),
    })
    return { row, restockedProductIds: restocked.map((x) => x.productId) }
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
