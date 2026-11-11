/**
 * Loads the store's sample data into a LOCAL development database.
 *
 *   pnpm db:seed
 *
 * It empties every table first, then inserts the catalog, customers, orders, coupons, banners,
 * returns, articles and reviews that the demo storefront already shows, so the database mirrors
 * the app. Refuses to run against anything that is not localhost.
 */
import "dotenv/config"

import argon2 from "argon2"
import { eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { seedArticles } from "./data/articles"
import { catalog, categories as demoCategories } from "./data/catalog"
import { addresses as demoAddresses } from "./data/account"
import { customers, initialBanners, initialCoupons, initialMovements, initialOrders, initialProducts, initialReturns, initialSettings } from "./data/admin"
import type { OrderStatus } from "../features/admin/types"
import { generateHistory } from "./data/history"
import { reviewsFor } from "./data/reviews"
import imageManifest from "../features/catalog/image-manifest.json"
import { gstFromInclusive } from "../lib/money"
import { lineNetPaise, refundForUnits } from "../lib/returns"
import * as s from "../lib/db/schema"

// NOTE: builds its own pool instead of importing lib/db, which imports "server-only" and throws outside Next.js.
const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL is not set. Add it to .env")
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production database.")
if (!/@(localhost|127\.0\.0\.1)(:|\/)/.test(url)) throw new Error("Refusing to seed a database that is not on localhost.")

const pool = new Pool({ connectionString: url })
const db = drizzle({ client: pool })

const IST = "+05:30"
const dayStart = (d: string) => new Date(`${d}T00:00:00${IST}`)
const dayEnd = (d: string) => new Date(`${d}T23:59:59${IST}`)
const parseCount = (v?: string) => { const n = Number((v ?? "0").replace(/[^0-9.]/g, "")); return Math.round(v?.includes("K") ? n * 1000 : n) }
const STATE_BY_CITY: Record<string, string> = { Bengaluru: "Karnataka", Kochi: "Kerala", Mumbai: "Maharashtra", Hyderabad: "Telangana", Pune: "Maharashtra", Chennai: "Tamil Nadu", Ahmedabad: "Gujarat", Delhi: "Delhi" }
const ARTICLE_CATEGORY = { "Buying guide": "buying_guide", "Product review": "product_review", Comparison: "comparison", News: "news" } as const
const BANNER_SLOT = { "Home hero": "home_hero", "Home promo grid": "home_promo_grid", "Category banner": "category_banner", "Cart banner": "cart_banner" } as const
const demoDate = (t: string) => { const d = new Date(`${t} 00:00 UTC`); return Number.isNaN(d.getTime()) ? new Date() : d }

async function main() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE TABLE contact_messages, newsletter_subscribers, return_items, order_notes, verifications, accounts, audit_events, settings, wishlist_items, reviews, article_products, articles, banners, coupon_redemptions, webhook_events, payments, order_events, order_items, returns, orders, coupons, stock_movements, stock_levels, product_images, products, tax_categories, categories, brands, sessions, addresses, users RESTART IDENTITY CASCADE`)

    // ---- Catalog lookups
    const taxRows = await tx.insert(s.taxCategories).values([
      { name: "Printed books (0%)", hsn: "4901", ratePercent: 0 },
      { name: "Essentials (5%)", ratePercent: 5 },
      { name: "Footwear, bags and toys (12%)", hsn: "6403", ratePercent: 12 },
      { name: "Electronics and appliances (18%)", hsn: "8518", ratePercent: 18 },
      { name: "Luxury goods (28%)", ratePercent: 28 },
    ]).returning()
    const catRows = await tx.insert(s.categories).values(demoCategories.map((c, i) => ({ name: c.name, shortName: c.short, slug: c.slug, sortOrder: i }))).returning()
    const brandRows = await tx.insert(s.brands).values([...new Set(catalog.map((p) => p.brand))].sort().map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))).returning()
    const taxByRate = new Map(taxRows.map((t) => [t.ratePercent, t.id]))
    const catBySlug = new Map(catRows.map((c) => [c.slug, c.id]))
    const brandByName = new Map(brandRows.map((b) => [b.name, b.id]))

    // ---- Products (admin sample gives SKUs, SEO text and stock; the storefront catalog gives badges and ratings)
    const productRows = await tx.insert(s.products).values(catalog.map((p) => {
      const a = initialProducts.find((x) => x.id === p.id)!
      const count = parseCount(p.reviews)
      return {
        categoryId: catBySlug.get(p.category)!, brandId: brandByName.get(p.brand)!, taxCategoryId: taxByRate.get(p.gstPercent)!,
        title: p.title, slug: p.slug, sku: a.sku, description: p.description, pricePaise: p.pricePaise, comparePaise: p.comparePaise ?? null,
        badge: p.badge ?? null, status: a.status, ratingCount: count, ratingSum: Math.min(count * 5, Math.round((p.rating ?? 0) * count)),
        seoTitle: a.seoTitle, seoDescription: a.seoDescription, createdAt: new Date(`${a.createdAt}T09:00:00Z`),
      }
    })).returning()
    // Demo photos from public/images (listed by `pnpm images`) become real product_images rows, so nothing that showed a photo before loses it.
    const manifestPhotos = (imageManifest as { products: Record<string, string[]> }).products
    const photoRows = productRows.flatMap((p) => (manifestPhotos[p.slug] ?? []).slice(0, 8).map((url, position) => ({ productId: p.id, url, alt: "", position })))
    if (photoRows.length) await tx.insert(s.productImages).values(photoRows)
    const productByDemoId = new Map(catalog.map((p) => [p.id, productRows.find((r) => r.slug === p.slug)!]))

    // ---- Stock: opening balance as a movement, plus the sample movements, so on_hand always equals the ledger
    const movementsByProduct = new Map<string, number>()
    initialMovements.forEach((m) => movementsByProduct.set(m.productId, (movementsByProduct.get(m.productId) ?? 0) + m.delta))
    await tx.insert(s.stockLevels).values(initialProducts.map((a) => ({ productId: productByDemoId.get(a.id)!.id, onHand: a.stock + (movementsByProduct.get(a.id) ?? 0), reserved: a.reserved, reorderAt: a.reorderAt })))
    await tx.insert(s.stockMovements).values([
      ...initialProducts.map((a) => ({ productId: productByDemoId.get(a.id)!.id, delta: a.stock, reason: "correction" as const, note: "Opening balance", reference: `opening:${a.sku}`, createdAt: new Date("2026-01-05T09:00:00Z") })).filter((m) => m.delta !== 0),
      ...initialMovements.map((m) => ({ productId: productByDemoId.get(m.productId)!.id, delta: m.delta, reason: m.reason, note: m.note, createdAt: new Date(m.at) })),
    ])

    // ---- People
    const hash = await argon2.hash(process.env.SEED_ADMIN_PASSWORD ?? "admin12345")
    const staff = await tx.insert(s.users).values((["owner", "catalog_editor", "warehouse", "support", "finance"] as const).map((role) => ({
      email: `${role.replace("_", "-")}@shopkart.local`, name: role === "owner" ? "Admin" : role.replace("_", " ").replace(/^./, (c) => c.toUpperCase()), role, emailVerified: true,
    }))).returning()
    // Optional extra owner for local development, taken from .env so no password lives in the repository.
    const ownerEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase(), ownerPassword = process.env.SEED_OWNER_PASSWORD
    if (ownerEmail && ownerPassword) {
      const [extra] = await tx.insert(s.users).values({ email: ownerEmail, name: "Admin", role: "owner", emailVerified: true }).returning()
      await tx.insert(s.accounts).values({ userId: extra.id, accountId: extra.id, providerId: "credential", password: await argon2.hash(ownerPassword) })
    }
    const customerRows = await tx.insert(s.users).values(customers.map((c) => ({
      email: c.email, name: c.name, phone: c.phone, role: "customer" as const,
      emailVerified: c.verified, createdAt: new Date(`${c.joined}T10:00:00Z`),
    }))).returning()
    // Better Auth keeps the password on a "credential" account. Staff and the first customer can sign in.
    await tx.insert(s.accounts).values([...staff, customerRows[0]].map((u) => ({ userId: u.id, accountId: u.id, providerId: "credential", password: hash })))
    const userByCustomerId = new Map(customers.map((c, i) => [c.id, customerRows[i]]))
    await tx.insert(s.addresses).values(demoAddresses.map((a) => ({ userId: userByCustomerId.get("c1")!.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? null, city: a.city, state: a.state, pincode: a.pincode, isDefault: a.isDefault })))

    // ---- Coupons
    await tx.insert(s.coupons).values(initialCoupons.map((c) => ({ code: c.code, kind: c.kind, value: c.value, minOrderPaise: c.minOrderPaise, usageLimit: c.limit, usedCount: c.used, expiresAt: dayEnd(c.expires), isActive: c.active })))

    // ---- Orders, items, timeline, payments
    for (const o of initialOrders) {
      const subtotal = o.lines.reduce((t, l) => t + l.pricePaise * l.quantity, 0)
      const gst = o.lines.reduce((t, l) => { const gross = l.pricePaise * l.quantity; const share = subtotal === 0 ? 0 : Math.round((gross / subtotal) * o.discountPaise); return t + gstFromInclusive(gross - share, l.gstPercent) }, 0)
      const [order] = await tx.insert(s.orders).values({
        number: o.id, userId: userByCustomerId.get(o.customerId)!.id, status: o.status, subtotalPaise: subtotal, discountPaise: o.discountPaise, shippingPaise: o.shippingPaise,
        gstIncludedPaise: gst, totalPaise: subtotal - o.discountPaise + o.shippingPaise, customerName: o.customerName, customerEmail: o.email, customerPhone: o.phone,
        shipTo: { name: o.customerName, phone: o.phone, line1: o.addressLine, city: o.city, state: STATE_BY_CITY[o.city] ?? "Karnataka", pincode: o.pincode }, placedAt: new Date(o.placed), createdAt: new Date(o.placed),
      }).returning()
      await tx.insert(s.orderItems).values(o.lines.map((l) => { const p = productByDemoId.get(l.productId)!; return { orderId: order.id, productId: p.id, title: l.title, sku: p.sku, quantity: l.quantity, unitPricePaise: l.pricePaise, gstPercent: l.gstPercent } }))
      if (o.notes.length) await tx.insert(s.orderNotes).values(o.notes.map((body) => ({ orderId: order.id, body })))
      await tx.insert(s.orderEvents).values(o.timeline.map((t) => ({ orderId: order.id, status: t.status, actorLabel: t.by, note: t.note ?? null, createdAt: new Date(t.at) })))
      const captured = !["pending", "cancelled"].includes(o.status)
      await tx.insert(s.payments).values({ orderId: order.id, providerOrderId: `order_demo_${o.id.slice(3)}`, providerPaymentId: captured ? o.paymentId : null, amountPaise: order.totalPaise, status: o.status === "refunded" ? "refunded" : captured ? "captured" : "created", method: o.paymentMethod, signatureVerifiedAt: captured ? new Date(o.placed) : null })
    }
    // A deterministic 90-day history, so the admin charts and reports have a realistic shape to show.
    const history = generateHistory(new Date(), catalog.map((p) => ({ id: p.id, pricePaise: p.pricePaise, gstPercent: p.gstPercent, title: p.title })), customerRows.length)
    const flowOrder = ["pending", "paid", "packed", "shipped", "delivered"] as const
    const priceOf = new Map(catalog.map((p) => [p.id, p]))
    for (let i = 0; i < history.length; i += 50) {
      const chunk = history.slice(i, i + 50)
      const built = chunk.map((h) => {
        const lines = h.lines.map((l) => ({ ...l, p: priceOf.get(l.productId)! }))
        const subtotal = lines.reduce((t, l) => t + l.p.pricePaise * l.quantity, 0)
        const shipping = subtotal >= 69900 ? 0 : 4900
        const gst = lines.reduce((t, l) => t + gstFromInclusive(l.p.pricePaise * l.quantity, l.p.gstPercent), 0)
        const c = customers[h.customerIndex]
        return { h, lines, row: { number: h.number, userId: customerRows[h.customerIndex].id, status: h.status, subtotalPaise: subtotal, discountPaise: 0, shippingPaise: shipping, gstIncludedPaise: gst, totalPaise: subtotal + shipping, customerName: c.name, customerEmail: c.email, customerPhone: c.phone, shipTo: { name: c.name, phone: c.phone, line1: `${10 + (i % 80)} MG Road`, city: c.city, state: STATE_BY_CITY[c.city] ?? "Karnataka", pincode: "560001" }, placedAt: h.placedAt, createdAt: h.placedAt } }
      })
      const inserted = await tx.insert(s.orders).values(built.map((b) => b.row)).returning()
      const byNumber = new Map(inserted.map((o) => [o.number, o]))
      await tx.insert(s.orderItems).values(built.flatMap((b) => b.lines.map((l) => ({ orderId: byNumber.get(b.h.number)!.id, productId: productByDemoId.get(l.productId)!.id, title: l.p.title, sku: productByDemoId.get(l.productId)!.sku, quantity: l.quantity, unitPricePaise: l.p.pricePaise, gstPercent: l.p.gstPercent }))))
      await tx.insert(s.orderEvents).values(built.flatMap((b) => {
        const id = byNumber.get(b.h.number)!.id, at = (hrs: number) => new Date(b.h.placedAt.getTime() + hrs * 3_600_000)
        const target = b.h.status === "cancelled" ? 0 : b.h.status === "refunded" ? 4 : flowOrder.indexOf(b.h.status as (typeof flowOrder)[number])
        const evs: { orderId: string; status: OrderStatus; actorLabel: string; note: string | null; createdAt: Date }[] = [{ orderId: id, status: "pending", actorLabel: "Customer", note: "Order placed", createdAt: at(0) }]
        for (let k = 1; k <= target; k++) evs.push({ orderId: id, status: flowOrder[k], actorLabel: k === 1 ? "Razorpay" : "Staff", note: null, createdAt: at(k * 1.5) })
        if (b.h.status === "cancelled") evs.push({ orderId: id, status: "cancelled", actorLabel: "Customer", note: "Cancelled before packing", createdAt: at(1) })
        if (b.h.status === "refunded") evs.push({ orderId: id, status: "refunded", actorLabel: "Finance", note: "Refund issued to original payment method", createdAt: at(96) })
        return evs
      }))
      await tx.insert(s.payments).values(built.map((b) => {
        const captured = !["pending", "cancelled"].includes(b.h.status)
        return { orderId: byNumber.get(b.h.number)!.id, providerOrderId: `order_demo_${b.h.number.slice(3)}`, providerPaymentId: captured ? `pay_demo_${b.h.number.slice(3)}` : null, amountPaise: b.row.totalPaise, status: b.h.status === "refunded" ? "refunded" as const : captured ? "captured" as const : "created" as const, method: b.h.method, signatureVerifiedAt: captured ? b.h.placedAt : null }
      }))
    }
    const orderByNumber = new Map((await tx.select().from(s.orders)).map((o) => [o.number, o]))
    // Returns: refund amounts come from the same rules the live server uses (lib/returns.ts), so demo numbers match real ones.
    const returnLines = await tx.select().from(s.orderItems)
    const productIdByDemo = new Map(productByDemoId)
    for (const r of initialReturns) {
      const order = orderByNumber.get(r.orderId)!
      const lines = returnLines.filter((l) => l.orderId === order.id)
      const picked = r.items.map(([demoId, quantity]) => ({ line: lines.find((l) => l.productId === productIdByDemo.get(demoId)!.id)!, quantity }))
      const refundPaise = picked.reduce((t, { line, quantity }) => t + refundForUnits(lineNetPaise(line, lines, order.discountPaise), line.quantity, quantity), 0)
      const [ret] = await tx.insert(s.returns).values({ number: r.number, orderId: order.id, status: r.status, reason: r.reason, note: r.note ?? null, requestedBy: order.userId, refundPaise, receivedAt: r.receivedAt ? new Date(r.receivedAt) : null, createdAt: new Date(r.requested) }).returning()
      await tx.insert(s.returnItems).values(picked.map(({ line, quantity }) => ({ returnId: ret.id, orderItemId: line.id, quantity })))
      if (r.status === "received" || r.status === "refunded") {
        // The goods are back on the shelf, so the ledger and the stock level both show it.
        for (const { line, quantity } of picked) {
          await tx.insert(s.stockMovements).values({ productId: line.productId, delta: quantity, reason: "return", note: `Return ${r.number}`, reference: `${r.number}:${line.productId}`, createdAt: new Date(r.receivedAt!) })
          await tx.update(s.stockLevels).set({ onHand: sql`${s.stockLevels.onHand} + ${quantity}` }).where(eq(s.stockLevels.productId, line.productId))
        }
      }
    }

    // ---- Marketing and content
    await tx.insert(s.banners).values(initialBanners.map((b) => ({ title: b.title, slot: BANNER_SLOT[b.slot as keyof typeof BANNER_SLOT], startsAt: dayStart(b.starts), endsAt: dayEnd(b.ends), href: b.href, isPaused: b.paused })))
    const articleRows = await tx.insert(s.articles).values(seedArticles.map((a) => ({
      slug: a.slug, title: a.title, excerpt: a.excerpt, category: ARTICLE_CATEGORY[a.category], authorName: a.author, status: a.status, publishedAt: a.status === "published" ? dayStart(a.publishedAt) : null,
      doc: a.doc, seoTitle: a.seoTitle, seoDescription: a.seoDescription, createdAt: dayStart(a.publishedAt), updatedAt: dayStart(a.updatedAt),
    }))).returning()
    const links = seedArticles.flatMap((a) => {
      const row = articleRows.find((r) => r.slug === a.slug)!
      return [...a.productIds.map((pid, i) => ({ articleId: row.id, productId: productByDemoId.get(pid)!.id, kind: "featured" as const, position: i })), ...a.compareIds.map((pid, i) => ({ articleId: row.id, productId: productByDemoId.get(pid)!.id, kind: "compare" as const, position: i }))]
    })
    if (links.length) await tx.insert(s.articleProducts).values(links)
    await tx.insert(s.reviews).values(catalog.flatMap((p) => reviewsFor(p.id, p.rating ?? 4.5).map((r) => ({
      productId: productByDemoId.get(p.id)!.id, authorName: r.name, rating: r.rating, title: r.title, body: r.body, status: "approved" as const, verifiedPurchase: r.verified, createdAt: demoDate(r.date),
    }))))

    // ---- Settings
    await tx.insert(s.settings).values(Object.entries(initialSettings).map(([key, value]) => ({ key, value })))
  })

  const counts = await db.execute(sql`select
    (select count(*) from products) as products, (select count(*) from categories) as categories, (select count(*) from users) as users,
    (select count(*) from orders) as orders, (select count(*) from reviews) as reviews, (select count(*) from articles) as articles`)
  console.log("Seeded:", JSON.stringify((counts as unknown as { rows: unknown[] }).rows[0]))
}

main().catch((err) => { console.error(err); process.exitCode = 1 }).finally(() => pool.end())
