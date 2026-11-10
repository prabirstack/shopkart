import "server-only"

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "../index"
import { returnItems } from "../schema"
import { articleProducts, articles, banners, productImages, contactMessages, brands, categories, coupons, orderEvents, orderItems, orderNotes, orders, payments, products, returns, reviews, settings, stockLevels, stockMovements, users } from "../schema"
import type { AdminBanner, AdminCoupon, AdminOrder, AdminProduct, AdminReturn, AdminReview, Customer, Settings, StockMovement } from "@/features/admin/types"
import { BANNER_SLOT_LABEL } from "@/features/admin/types"
import type { Article, ArticleCategory } from "@/features/articles/types"

// Loaders for the admin screens. They return the plain shapes the screens already use (ids, ISO dates,
// paise), mapped from the real tables. They do NO permission checks: only call them from inside <Authorized>.

const day = (d: Date) => d.toISOString().slice(0, 10)

const productSelect = {
  id: products.id, title: products.title, slug: products.slug, sku: products.sku, category: categories.slug, brand: brands.name,
  pricePaise: products.pricePaise, comparePaise: products.comparePaise, gstPercent: sql<number>`(select rate_percent from tax_categories t where t.id = ${products.taxCategoryId})`,
  stock: sql<number>`coalesce(${stockLevels.onHand}, 0)`, reserved: sql<number>`coalesce(${stockLevels.reserved}, 0)`, reorderAt: sql<number>`coalesce(${stockLevels.reorderAt}, 10)`,
  status: products.status, description: products.description, seoTitle: products.seoTitle, seoDescription: products.seoDescription, createdAt: products.createdAt,
}

const toProduct = (r: Record<string, unknown>, images: NonNullable<AdminProduct["images"]> = []): AdminProduct => ({
  id: r.id as string, title: r.title as string, slug: r.slug as string, sku: r.sku as string, category: r.category as string, brand: r.brand as string,
  pricePaise: r.pricePaise as number, comparePaise: (r.comparePaise as number | null) ?? null, gstPercent: Number(r.gstPercent),
  stock: Number(r.stock), reserved: Number(r.reserved), reorderAt: Number(r.reorderAt), status: r.status as AdminProduct["status"],
  description: r.description as string, seoTitle: r.seoTitle as string, seoDescription: r.seoDescription as string, createdAt: day(r.createdAt as Date), images,
})

/** Photos for the given products, grouped by product, in display order. */
async function imagesFor(ids: string[]) {
  const map = new Map<string, NonNullable<AdminProduct["images"]>>()
  if (ids.length === 0) return map
  for (const i of await db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.productId), asc(productImages.position)))
    map.set(i.productId, [...(map.get(i.productId) ?? []), { url: i.url, alt: i.alt, width: i.width, height: i.height }])
  return map
}

function baseProducts() {
  return db.select(productSelect).from(products).innerJoin(categories, eq(categories.id, products.categoryId)).innerJoin(brands, eq(brands.id, products.brandId)).leftJoin(stockLevels, eq(stockLevels.productId, products.id))
}

export async function loadAdminProducts(): Promise<AdminProduct[]> {
  const rows = await baseProducts().orderBy(desc(products.createdAt), asc(products.id))
  const imgs = await imagesFor(rows.map((r) => r.id))
  return rows.map((r) => toProduct(r, imgs.get(r.id)))
}

export async function loadAdminProduct(id: string): Promise<AdminProduct | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const [r] = await baseProducts().where(eq(products.id, id)).limit(1)
  return r ? toProduct(r, (await imagesFor([r.id])).get(r.id)) : null
}

export async function loadAdminRefs() {
  const [cats, bs] = await Promise.all([db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)), db.select({ name: brands.name }).from(brands).orderBy(asc(brands.name))])
  return { categories: cats, brands: bs.map((b) => b.name) }
}

export async function loadAdminMovements(limit = 300): Promise<StockMovement[]> {
  const rows = await db.select({ id: stockMovements.id, productId: stockMovements.productId, delta: stockMovements.delta, reason: stockMovements.reason, note: stockMovements.note, at: stockMovements.createdAt, by: users.name })
    .from(stockMovements).leftJoin(users, eq(users.id, stockMovements.actorId)).orderBy(desc(stockMovements.createdAt)).limit(limit)
  return rows.map((r) => ({ id: r.id, productId: r.productId, delta: r.delta, reason: (r.reason === "reservation_release" ? "correction" : r.reason) as StockMovement["reason"], note: r.note, at: r.at.toISOString(), by: r.by ?? "System" }))
}

type OrderRow = typeof orders.$inferSelect

async function hydrateOrders(rows: OrderRow[]): Promise<AdminOrder[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const [items, events, notes, pays] = await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, ids)),
    db.select().from(orderEvents).where(inArray(orderEvents.orderId, ids)).orderBy(asc(orderEvents.createdAt)),
    db.select().from(orderNotes).where(inArray(orderNotes.orderId, ids)).orderBy(desc(orderNotes.createdAt)),
    db.select().from(payments).where(inArray(payments.orderId, ids)).orderBy(asc(payments.createdAt)),
  ])
  return rows.map((o) => {
    const pay = pays.filter((p) => p.orderId === o.id).at(-1)
    return {
      id: o.number, customerId: o.userId, customerName: o.customerName, email: o.customerEmail, phone: o.customerPhone, placed: o.placedAt.toISOString(), status: o.status,
      lines: items.filter((i) => i.orderId === o.id).map((i) => ({ productId: i.productId, title: i.title, quantity: i.quantity, pricePaise: i.unitPricePaise, gstPercent: i.gstPercent })),
      discountPaise: o.discountPaise, shippingPaise: o.shippingPaise, paymentMethod: pay?.method ?? "—", paymentId: pay?.providerPaymentId ?? "—",
      city: o.shipTo.city, state: o.shipTo.state, pincode: o.shipTo.pincode, addressLine: [o.shipTo.line1, o.shipTo.line2].filter(Boolean).join(", "),
      timeline: events.filter((e) => e.orderId === o.id).map((e) => ({ status: e.status, at: e.createdAt.toISOString(), by: e.actorLabel, note: e.note ?? undefined })),
      notes: notes.filter((n) => n.orderId === o.id).map((n) => n.body),
    }
  })
}

export async function loadAdminOrders(limit = 500): Promise<AdminOrder[]> {
  return hydrateOrders(await db.select().from(orders).orderBy(desc(orders.placedAt), asc(orders.id)).limit(limit))
}

export async function loadAdminOrder(number: string): Promise<AdminOrder | null> {
  return (await hydrateOrders(await db.select().from(orders).where(eq(orders.number, number)).limit(1)))[0] ?? null
}

export async function loadAdminCustomers(): Promise<Customer[]> {
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, joined: users.createdAt, verified: users.emailVerified,
    city: sql<string | null>`coalesce((select ship_to->>'city' from orders o where o.user_id = ${users.id} order by o.placed_at desc limit 1), (select city from addresses a where a.user_id = ${users.id} order by is_default desc limit 1))` })
    .from(users).where(eq(users.role, "customer")).orderBy(desc(users.createdAt))
  return rows.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone ?? "—", city: r.city ?? "—", joined: day(r.joined), verified: r.verified }))
}

export async function loadAdminCoupons(): Promise<AdminCoupon[]> {
  return (await db.select().from(coupons).orderBy(desc(coupons.createdAt))).map((c) => ({ id: c.id, code: c.code, kind: c.kind, value: c.value, minOrderPaise: c.minOrderPaise, used: c.usedCount, limit: c.usageLimit, expires: day(c.expiresAt), active: c.isActive }))
}

export async function loadAdminBanners(): Promise<AdminBanner[]> {
  return (await db.select().from(banners).orderBy(desc(banners.startsAt))).map((b) => ({ id: b.id, title: b.title, slot: BANNER_SLOT_LABEL[b.slot], starts: day(b.startsAt), ends: day(b.endsAt), href: b.href, paused: b.isPaused, image: b.imageUrl ? { url: b.imageUrl, alt: b.imageAlt, width: b.imageWidth, height: b.imageHeight } : null }))
}

export async function loadAdminReturns(): Promise<AdminReturn[]> {
  const rows = await db.select({ id: returns.id, number: returns.number, order: orders.number, customerName: orders.customerName, reason: returns.reason, note: returns.note, refundPaise: returns.refundPaise, status: returns.status, requested: returns.createdAt, receivedAt: returns.receivedAt })
    .from(returns).innerJoin(orders, eq(orders.id, returns.orderId)).orderBy(desc(returns.createdAt), desc(returns.number))
  const lines = rows.length === 0 ? [] : await db.select({ returnId: returnItems.returnId, title: orderItems.title, quantity: returnItems.quantity }).from(returnItems).innerJoin(orderItems, eq(orderItems.id, returnItems.orderItemId)).where(inArray(returnItems.returnId, rows.map((r) => r.id))).orderBy(asc(orderItems.title))
  return rows.map((r) => ({
    id: r.id, number: r.number, orderId: r.order, customerName: r.customerName, reason: r.reason, note: r.note, refundPaise: r.refundPaise, status: r.status,
    requested: r.requested.toISOString(), receivedAt: r.receivedAt?.toISOString() ?? null, items: lines.filter((l) => l.returnId === r.id).map((l) => ({ title: l.title, quantity: l.quantity })),
  }))
}

export async function loadAdminReviews(limit = 500): Promise<AdminReview[]> {
  const rows = await db.select({ id: reviews.id, productId: reviews.productId, productTitle: products.title, productSlug: products.slug, name: reviews.authorName, rating: reviews.rating, title: reviews.title, body: reviews.body, status: reviews.status, verified: reviews.verifiedPurchase, date: reviews.createdAt })
    .from(reviews).innerJoin(products, eq(products.id, reviews.productId)).orderBy(desc(reviews.createdAt), asc(reviews.id)).limit(limit)
  return rows.map((r) => ({ ...r, date: r.date.toISOString() }))
}

const CATEGORY_LABEL: Record<string, ArticleCategory> = { buying_guide: "Buying guide", product_review: "Product review", comparison: "Comparison", news: "News" }

export async function loadAdminArticles(): Promise<Article[]> {
  const [rows, links] = await Promise.all([db.select().from(articles).orderBy(desc(articles.updatedAt)), db.select().from(articleProducts).orderBy(asc(articleProducts.position))])
  return rows.map((a) => ({
    id: a.id, slug: a.slug, title: a.title, excerpt: a.excerpt, category: CATEGORY_LABEL[a.category], author: a.authorName, publishedAt: day(a.publishedAt ?? a.createdAt), updatedAt: day(a.updatedAt), status: a.status,
    productIds: links.filter((l) => l.articleId === a.id && l.kind === "featured").map((l) => l.productId), compareIds: links.filter((l) => l.articleId === a.id && l.kind === "compare").map((l) => l.productId),
    seoTitle: a.seoTitle, seoDescription: a.seoDescription, doc: a.doc as Article["doc"],
  }))
}

export async function loadAdminProductChoices() {
  return db.select({ id: products.id, title: products.title, slug: products.slug }).from(products).where(sql`${products.status} <> 'archived'`).orderBy(asc(products.title))
}

export const DEFAULT_SETTINGS: Settings = {
  storeName: "ShopKart", supportEmail: "support@shopkart.example", phone: "1800-000-0000", gstin: "", freeDeliveryAboveRupees: 699, shippingFeeRupees: 49, returnDays: 7,
  razorpayMode: "test", lowStockDefault: 10, notifyNewOrder: true, notifyLowStock: true, notifyReturn: true,
}

export async function loadAdminSettings(): Promise<Settings> {
  const rows = await db.select().from(settings)
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) } as Settings
}

/** Badge counts for the sidebar and bell. Only counts the role is allowed to see are computed. */
export type AdminCounts = { orders: number; pendingPayment: number; stock: number; returns: number; reviews: number; inbox: number; lowItems: { title: string; available: number }[] }

export async function loadAdminCounts(can: { orders: boolean; stock: boolean; returns: boolean; reviews: boolean; inbox: boolean }): Promise<AdminCounts> {
  const [o, s, r, v, pp, low, ib] = await Promise.all([
    can.orders ? db.select({ n: sql<number>`count(*)::int` }).from(orders).where(inArray(orders.status, ["pending", "paid"])) : [{ n: 0 }],
    can.stock ? db.select({ n: sql<number>`count(*)::int` }).from(stockLevels).innerJoin(products, eq(products.id, stockLevels.productId)).where(and(sql`${products.status} <> 'archived'`, sql`${stockLevels.onHand} - ${stockLevels.reserved} <= ${stockLevels.reorderAt}`)) : [{ n: 0 }],
    can.returns ? db.select({ n: sql<number>`count(*)::int` }).from(returns).where(eq(returns.status, "requested")) : [{ n: 0 }],
    can.reviews ? db.select({ n: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.status, "pending")) : [{ n: 0 }],
    can.orders ? db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "pending")) : [{ n: 0 }],
    can.stock ? db.select({ title: products.title, available: sql<number>`${stockLevels.onHand} - ${stockLevels.reserved}` }).from(stockLevels).innerJoin(products, eq(products.id, stockLevels.productId)).where(and(sql`${products.status} <> 'archived'`, sql`${stockLevels.onHand} - ${stockLevels.reserved} <= ${stockLevels.reorderAt}`)).orderBy(sql`${stockLevels.onHand} - ${stockLevels.reserved}`).limit(4) : [],
    can.inbox ? db.select({ n: sql<number>`count(*)::int` }).from(contactMessages).where(eq(contactMessages.status, "new")) : [{ n: 0 }],
  ])
  return { orders: o[0].n, pendingPayment: pp[0].n, stock: s[0].n, returns: r[0].n, reviews: v[0].n, inbox: ib[0].n, lowItems: low.map((l) => ({ title: l.title, available: Math.max(Number(l.available), 0) })) }
}
