import { beforeEach, describe, expect, it } from "vitest"

import { POST as bulk } from "../../app/api/v1/admin/products/bulk/route"
import { POST as placeOrder } from "../../app/api/v1/orders/route"
import { makeCatalog, makeProduct, resetDb } from "../helpers"
import { json, req, signUp } from "./helpers"

const address = { name: "Test User", phone: "9800000001", line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" }

describe("admin product management", () => {
  beforeEach(resetDb)

  it("refuses to delete a product that is on a past order, and says to archive it", async () => {
    const cat = await makeCatalog(); const ordered = await makeProduct(cat, { pricePaise: 20000 }); const unused = await makeProduct(cat)
    const buyer = await signUp(), owner = await signUp("owner")
    const placed = await json(await placeOrder(req("/api/v1/orders", { method: "POST", cookie: buyer.cookie, body: { items: [{ productId: ordered.id, quantity: 1 }], customer: { name: "Test User", email: "t@x.com", phone: "9800000001" }, shipTo: address } })))
    expect(placed.status, JSON.stringify(placed.body)).toBe(201)
    const call = (ids: string[], action: string) => bulk(req("/api/v1/admin/products/bulk", { method: "POST", cookie: owner.cookie, body: { ids, action } }))
    const refused = await json(await call([ordered.id], "delete"))
    expect(refused.status).toBe(409); expect(refused.body.error.code).toBe("IN_USE"); expect(refused.body.error.message).toMatch(/archive/i)
    expect((await json(await call([ordered.id], "archive"))).body.data).toEqual({ updated: 1 })
    expect((await json(await call([unused.id], "delete"))).body.data).toEqual({ deleted: 1 })
  })

  it("only lets people with the catalog permission change products", async () => {
    const cat = await makeCatalog(); const p = await makeProduct(cat); const support = await signUp("support")
    expect((await json(await bulk(req("/api/v1/admin/products/bulk", { method: "POST", cookie: support.cookie, body: { ids: [p.id], action: "archive" } })))).status).toBe(403)
  })
})

// ------------------------------------------------------------------------------------------------
import { eq } from "drizzle-orm"
import { PUT as putSettings } from "../../app/api/v1/admin/settings/route"
import { POST as refund } from "../../app/api/v1/admin/orders/[number]/refund/route"
import { POST as addNote } from "../../app/api/v1/admin/orders/[number]/notes/route"
import { POST as createCoupon } from "../../app/api/v1/admin/coupons/route"
import { DELETE as deleteCoupon } from "../../app/api/v1/admin/coupons/[id]/route"
import { POST as createProduct } from "../../app/api/v1/admin/products/route"
import { PATCH as patchArticle, DELETE as deleteArticleRoute } from "../../app/api/v1/admin/articles/[id]/route"
import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { EMPTY_REPORT, loadAdminDashboard, loadAdminReports, loadDashboardData } from "../../lib/db/queries/admin-reports"
import { loadAdminCounts } from "../../lib/db/queries"
import { ctx } from "./helpers"
import { makeUser } from "../helpers"

const shipTo = { name: "Test User", phone: "9800000001", line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" }
async function makeOrder(status: "delivered" | "paid" | "pending", total = 50000, catalog?: Awaited<ReturnType<typeof makeCatalog>>) {
  const u = await makeUser(); const cat = catalog ?? await makeCatalog(); const p = await makeProduct(cat)
  const [o] = await db.insert(s.orders).values({ userId: u.id, status, customerName: "Test User", customerEmail: "t@x.com", customerPhone: "9800000001", shipTo, subtotalPaise: total, totalPaise: total }).returning()
  await db.insert(s.orderItems).values({ orderId: o.id, productId: p.id, title: p.title, sku: p.sku, quantity: 1, unitPricePaise: total, gstPercent: 18 })
  if (status !== "pending") await db.insert(s.payments).values({ orderId: o.id, providerOrderId: `o_${o.number}`, providerPaymentId: `pay_mock_${o.number}`, amountPaise: total, status: "captured" })
  return o
}

describe("admin refunds, notes and settings", () => {
  beforeEach(resetDb)

  it("refunds only delivered orders, marks the payment refunded, and needs the returns permission", async () => {
    const cat = await makeCatalog(); const delivered = await makeOrder("delivered", 50000, cat), paid = await makeOrder("paid", 50000, cat)
    const finance = await signUp("finance"), warehouse = await signUp("warehouse")
    const call = (n: string, cookie: string) => refund(req(`/api/v1/admin/orders/${n}/refund`, { method: "POST", cookie }), ctx({ number: n }))
    expect((await json(await call(delivered.number, warehouse.cookie))).status).toBe(403)
    expect((await json(await call(paid.number, finance.cookie))).body.error.code).toBe("INVALID_TRANSITION")
    const ok = await json(await call(delivered.number, finance.cookie)); expect(ok.body.data.status).toBe("refunded"); expect(ok.body.data.events.at(-1).status).toBe("refunded")
    expect((await db.select().from(s.payments).where(eq(s.payments.orderId, delivered.id)))[0].status).toBe("refunded")
    expect((await json(await call(delivered.number, finance.cookie))).status).toBe(409) // can't refund twice
  })

  it("stores private order notes with their author", async () => {
    const o = await makeOrder("paid"); const staff = await signUp("support")
    const r = await json(await addNote(req(`/api/v1/admin/orders/${o.number}/notes`, { method: "POST", cookie: staff.cookie, body: { body: "Customer asked for gift wrap" } }), ctx({ number: o.number })))
    expect(r.status).toBe(201)
    const [n] = await db.select().from(s.orderNotes); expect(n).toMatchObject({ body: "Customer asked for gift wrap", authorId: staff.userId })
    expect((await json(await addNote(req(`/api/v1/admin/orders/${o.number}/notes`, { method: "POST", cookie: staff.cookie, body: { body: "" } }), ctx({ number: o.number })))).status).toBe(422)
  })

  it("validates settings strictly and lets only the owner save them", async () => {
    const good = { storeName: "ShopKart", supportEmail: "support@shopkart.example", phone: "1800-000-0000", gstin: "29ABCDE1234F1Z5", freeDeliveryAboveRupees: 699, shippingFeeRupees: 49, returnDays: 7, razorpayMode: "test", lowStockDefault: 10, notifyNewOrder: true, notifyLowStock: true, notifyReturn: true }
    const owner = await signUp("owner"), finance = await signUp("finance")
    const put = (cookie: string, body: object) => putSettings(req("/api/v1/admin/settings", { method: "PUT", cookie, body }))
    expect((await json(await put(finance.cookie, good))).status).toBe(403)
    expect((await json(await put(owner.cookie, good))).status).toBe(200)
    const bad = await json(await put(owner.cookie, { ...good, gstin: "NOPE" })); expect(bad.status).toBe(422); expect(bad.body.error.details[0].path).toBe("gstin")
    expect((await json(await put(owner.cookie, { ...good, returnDays: 400 }))).status).toBe(422)
    expect((await json(await put(owner.cookie, { ...good, sneaky: "x" }))).status).toBe(422) // unknown keys are rejected
  })

  it("won't delete a coupon that was used, and deletes one that wasn't", async () => {
    const owner = await signUp("owner"); const u = await makeUser(); const o = await makeOrder("paid")
    const mk = async (code: string) => (await json(await createCoupon(req("/api/v1/admin/coupons", { method: "POST", cookie: owner.cookie, body: { code, kind: "percent", value: 10, usageLimit: 5, expiresAt: new Date(Date.now() + 864e5).toISOString() } })))).body.data
    const used = await mk("USEDONE"), fresh = await mk("FRESHONE")
    await db.insert(s.couponRedemptions).values({ couponId: used.id, userId: u.id, orderId: o.id })
    const del = (id: string) => deleteCoupon(req(`/api/v1/admin/coupons/${id}`, { method: "DELETE", cookie: owner.cookie }), ctx({ id }))
    const refused = await json(await del(used.id)); expect(refused.status).toBe(409); expect(refused.body.error.code).toBe("IN_USE")
    expect((await del(fresh.id)).status).toBe(204)
    const dup = await json(await createCoupon(req("/api/v1/admin/coupons", { method: "POST", cookie: owner.cookie, body: { code: "USEDONE", kind: "percent", value: 10, usageLimit: 5, expiresAt: new Date(Date.now() + 864e5).toISOString() } })))
    expect(dup.status).toBe(409); expect(dup.body.error.details[0].path).toBe("code") // the clash is reported on the right field
  })

  it("reports a duplicate SKU or slug against the field that clashed, and creates brands on demand", async () => {
    const cat = await makeCatalog(); await makeProduct(cat, { sku: "TAKEN-1", slug: "taken-slug" }); const editor = await signUp("catalog_editor")
    const body = { title: "Brand New Thing", slug: "brand-new", sku: "NEW-1", categorySlug: "electronics", brandName: "Freshly Added Brand", gstPercent: 18, pricePaise: 10000, status: "draft", initialStock: 3 }
    const post = (b: object) => createProduct(req("/api/v1/admin/products", { method: "POST", cookie: editor.cookie, body: b }))
    expect((await json(await post({ ...body, sku: "TAKEN-1" }))).body.error.details[0].path).toBe("sku")
    expect((await json(await post({ ...body, slug: "taken-slug" }))).body.error.details[0].path).toBe("slug")
    expect((await json(await post(body))).status).toBe(201)
    expect((await db.select().from(s.brands).where(eq(s.brands.name, "Freshly Added Brand"))).length).toBe(1)
    expect((await json(await post({ ...body, slug: "x2", sku: "X2", categorySlug: "nope" }))).body.error.code).toBe("INVALID_CATEGORY")
    // opening stock is recorded as a movement so the ledger always adds up to the level
    expect((await db.select().from(s.stockMovements).where(eq(s.stockMovements.reason, "correction"))).some((m) => m.delta === 3)).toBe(true)
  })

  it("toggles and deletes articles with the content permission only", async () => {
    const [a] = await db.insert(s.articles).values({ slug: "a-1", title: "Title one", excerpt: "An excerpt long enough", category: "news", status: "draft", doc: { type: "doc" } }).returning()
    const editor = await signUp("catalog_editor"), warehouse = await signUp("warehouse")
    const patch = (cookie: string, status: string) => patchArticle(req(`/api/v1/admin/articles/${a.id}`, { method: "PATCH", cookie, body: { status } }), ctx({ id: a.id }))
    expect((await json(await patch(warehouse.cookie, "published"))).status).toBe(403)
    expect((await json(await patch(editor.cookie, "published"))).status).toBe(200)
    expect((await db.select().from(s.articles))[0].publishedAt).toBeInstanceOf(Date)
    expect((await deleteArticleRoute(req(`/api/v1/admin/articles/${a.id}`, { method: "DELETE", cookie: editor.cookie }), ctx({ id: a.id }))).status).toBe(204)
  })
})

describe("admin dashboard data is scoped to what a role may see", () => {
  beforeEach(resetDb)
  const none = { reports: false, orders: false, inventory: false, catalog: false, coupons: false, returns: false, reviews: false, inbox: false }

  it("returns nothing, and queries nothing, for a role without the permissions", async () => {
    await makeOrder("paid")
    const d = await loadAdminDashboard(none)
    expect(d).toEqual({ statusCounts: null, pendingPayment: null, toPack: null, recentOrders: null, low: null, lowCount: null, openReturns: null, newMessages: null, pendingReviews: null, activity: [] })
    expect(EMPTY_REPORT.series).toEqual([]); expect(await loadAdminCounts({ orders: false, stock: false, returns: false, reviews: false, inbox: false })).toMatchObject({ orders: 0, stock: 0, returns: 0, reviews: 0, lowItems: [] })
  })

  it("counts only paid-and-not-cancelled orders in sales reports, and zero-fills quiet days", async () => {
    const cat = await makeCatalog(); await makeOrder("paid", 100000, cat); await makeOrder("delivered", 50000, cat); await makeOrder("pending", 999999, cat)
    const r = await loadAdminReports(7)
    expect(r.series).toHaveLength(7); expect(r.series.reduce((t, d) => t + d.revenue, 0)).toBe(150000); expect(r.series.reduce((t, d) => t + d.orders, 0)).toBe(2)
    expect(r.countedOrders).toBe(2); expect(r.countedTotalPaise).toBe(150000)
    expect(r.gstRows[0]).toMatchObject({ rate: 18 }); expect(r.gstRows[0].taxable + r.gstRows[0].gst).toBe(150000) // GST splits reconcile with the total
    expect(r.series.filter((d) => d.orders === 0).length).toBeGreaterThanOrEqual(5)
  })

  it("shows the widgets a role is allowed, and the low-stock list only with inventory access", async () => {
    const cat = await makeCatalog(); await makeProduct(cat, { title: "Almost Gone", stock: 2 }); await makeOrder("paid", 50000, cat)
    const inv = await loadAdminDashboard({ ...none, inventory: true })
    expect(inv.low?.[0]).toMatchObject({ title: "Almost Gone", left: 2 }); expect(inv.recentOrders).toBeNull()
    const ord = await loadAdminDashboard({ ...none, orders: true })
    expect(ord.recentOrders).toHaveLength(1); expect(ord.low).toBeNull()
  })
  it("never puts revenue, orders or customer data in the payload of a role that may not read them", async () => {
    const cat = await makeCatalog(); await makeProduct(cat, { title: "Almost Gone", stock: 1 }); await makeOrder("paid", 123400, cat); await makeOrder("pending", 99900, cat)
    // Catalog editor: no reports, no orders. Only stock, reviews and the like.
    const editor = await loadDashboardData("catalog_editor")
    expect(editor.report).toEqual(EMPTY_REPORT)
    expect(editor.extras).toMatchObject({ statusCounts: null, recentOrders: null, pendingPayment: null, toPack: null, openReturns: null, newMessages: null })
    const editorJson = JSON.stringify(editor)
    for (const secret of ["Test User", "t@x.com", "9800000001", "123400", "99900", "totalPaise", "customerName"]) expect(editorJson).not.toContain(secret)
    expect(editor.extras.low?.[0]).toMatchObject({ title: "Almost Gone" })
    // Warehouse and support may see orders, but never revenue, category or product sales, or the hourly pattern.
    for (const role of ["warehouse", "support"] as const) {
      const d = await loadDashboardData(role)
      expect(d.report, role).toEqual(EMPTY_REPORT)
      expect(d.extras.recentOrders, role).toHaveLength(2)
      expect(d.extras.toPack, role).toBe(1); expect(d.extras.pendingPayment, role).toBe(1)
    }
    expect((await loadDashboardData("warehouse")).extras.openReturns).toBeNull() // warehouse has no returns permission
    // Finance may read reports, so sales series, category and product breakdowns are present.
    const fin = await loadDashboardData("finance")
    expect(fin.report.series.reduce((t, d) => t + d.revenue, 0)).toBe(123400)
    expect(fin.report.categoryDaily.reduce((t, r) => t + r.revenue, 0)).toBe(123400); expect(fin.report.productDaily).toHaveLength(1)
    expect(fin.report.hourly.reduce((t, h) => t + h.n, 0)).toBe(1)
    expect(fin.extras.low).toBeNull() // finance has no inventory permission
  })

  it("splits sales by category and product per day so the screen can follow the chosen range", async () => {
    const cat = await makeCatalog(); await makeOrder("paid", 100000, cat); await makeOrder("delivered", 50000, cat); await makeOrder("pending", 77700, cat)
    const r = await loadAdminReports(7)
    expect(r.categoryDaily.reduce((t, c) => t + c.revenue, 0)).toBe(150000)
    expect(r.productDaily.reduce((t, c) => t + c.units, 0)).toBe(2)
    expect(r.categoryDaily.every((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.date))).toBe(true)
  })
})
