import { beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import { POST as placeOrder } from "../../app/api/v1/orders/route"
import { POST as validateCoupon } from "../../app/api/v1/coupons/validate/route"
import { POST as expireRoute } from "../../app/api/v1/internal/expire-orders/route"
import { cancelOrder, createOrder, expireStalePendingOrders, markOrderPaid } from "../../lib/db/queries"
import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { address, customer, makeCatalog, makeCoupon, makeProduct, makeUser, resetDb, stockOf } from "../helpers"
import { json, req, signUp } from "./helpers"

let n = 0
const place = (userId: string, items: { productId: string; quantity: number }[], couponCode?: string) =>
  createOrder({ userId, items, couponCode, customer, shipTo: address, providerOrderId: `order_lc${++n}` })
const pay = (o: Awaited<ReturnType<typeof place>>) => markOrderPaid({ providerOrderId: o.payments[0].providerOrderId, providerPaymentId: `pay_${o.number}`, amountPaise: o.totalPaise })

describe("orders with several products", () => {
  beforeEach(resetDb)

  it("pays an order with multiple different products and records one sale per product", async () => {
    const cat = await makeCatalog(); const a = await makeProduct(cat, { stock: 10 }), b = await makeProduct(cat, { stock: 10 }), c = await makeProduct(cat, { stock: 10 })
    const u = await makeUser()
    const o = await place(u.id, [{ productId: a.id, quantity: 2 }, { productId: b.id, quantity: 1 }, { productId: c.id, quantity: 3 }])
    const r = await pay(o)
    expect(r.order.status).toBe("paid")
    expect((await stockOf(a.id)).onHand).toBe(8); expect((await stockOf(b.id)).onHand).toBe(9); expect((await stockOf(c.id)).onHand).toBe(7)
    const sales = (await db.select().from(s.stockMovements)).filter((m) => m.reason === "sale")
    expect(sales).toHaveLength(3); expect(new Set(sales.map((m) => m.reference)).size).toBe(3)
    expect((await pay(o)).alreadyPaid).toBe(true) // still idempotent
  })

  it("cancelling a paid multi-product order returns every product to the shelf", async () => {
    const cat = await makeCatalog(); const a = await makeProduct(cat, { stock: 5 }), b = await makeProduct(cat, { stock: 5 })
    const u = await makeUser(); const o = await place(u.id, [{ productId: a.id, quantity: 2 }, { productId: b.id, quantity: 2 }]); await pay(o)
    await cancelOrder({ number: o.number, actorId: null })
    expect((await stockOf(a.id)).onHand).toBe(5); expect((await stockOf(b.id)).onHand).toBe(5)
  })
})

describe("coupons across an order's life", () => {
  beforeEach(resetDb)

  it("gives the coupon back when an unpaid order is cancelled, but not when a paid one is", async () => {
    const cat = await makeCatalog(); const p = await makeProduct(cat, { pricePaise: 100000, stock: 20 }); const c = await makeCoupon({ code: "BACK", usageLimit: 5 })
    const u = await makeUser(); const used = async () => (await db.select().from(s.coupons).where(eq(s.coupons.id, c.id)))[0].usedCount
    const unpaid = await place(u.id, [{ productId: p.id, quantity: 1 }], "BACK"); expect(await used()).toBe(1)
    await cancelOrder({ number: unpaid.number, actorId: null }); expect(await used()).toBe(0)
    expect(await db.select().from(s.couponRedemptions)).toHaveLength(0)
    const again = await place(u.id, [{ productId: p.id, quantity: 1 }], "BACK") // allowed again
    await pay(again); await cancelOrder({ number: again.number, actorId: null }); expect(await used()).toBe(1) // paid: the use stays
  })

  it("tells a signed-in customer in the preview that they already used a coupon", async () => {
    const cat = await makeCatalog(); const p = await makeProduct(cat, { pricePaise: 100000, stock: 20 }); await makeCoupon({ code: "ONCEONLY" })
    const u = await signUp(); const body = { code: "onceonly", items: [{ productId: p.id, quantity: 1 }] }
    const ask = () => validateCoupon(req("/api/v1/coupons/validate", { method: "POST", cookie: u.cookie, body }))
    expect((await json(await ask())).body.data.valid).toBe(true)
    await placeOrder(req("/api/v1/orders", { method: "POST", cookie: u.cookie, body: { items: body.items, couponCode: "ONCEONLY", customer, shipTo: address } }))
    const second = (await json(await ask())).body.data; expect(second.valid).toBe(false); expect(second.reason).toMatch(/already used/)
  })
})

describe("abandoned checkouts", () => {
  beforeEach(resetDb)

  it("expires old unpaid orders, releasing stock, and leaves recent and paid ones alone", async () => {
    const cat = await makeCatalog(); const p = await makeProduct(cat, { stock: 10 }); const u = await makeUser()
    const old = await place(u.id, [{ productId: p.id, quantity: 3 }]), fresh = await place(u.id, [{ productId: p.id, quantity: 2 }]), paid = await place(u.id, [{ productId: p.id, quantity: 1 }])
    await pay(paid)
    await db.update(s.orders).set({ placedAt: new Date(Date.now() - 2 * 3_600_000) }).where(eq(s.orders.id, old.id))
    await db.update(s.orders).set({ placedAt: new Date(Date.now() - 2 * 3_600_000) }).where(eq(s.orders.id, paid.id))
    expect(await expireStalePendingOrders(30)).toBe(1)
    const status = async (id: string) => (await db.select().from(s.orders).where(eq(s.orders.id, id)))[0].status
    expect(await status(old.id)).toBe("cancelled"); expect(await status(fresh.id)).toBe("pending"); expect(await status(paid.id)).toBe("paid")
    expect(await stockOf(p.id)).toMatchObject({ onHand: 9, reserved: 2 }) // only the fresh order still holds units
    expect(await expireStalePendingOrders(30)).toBe(0) // running it again changes nothing
  })

  it("only runs for a caller with the shared secret, and does not exist without one", async () => {
    const call = (auth?: string) => expireRoute(new Request("http://localhost:3000/api/v1/internal/expire-orders", { method: "POST", headers: auth ? { authorization: auth } : {} }))
    delete process.env.CRON_SECRET
    expect((await json(await call("Bearer anything"))).status).toBe(404)
    process.env.CRON_SECRET = "test-cron-secret-123"
    try {
      expect((await json(await call())).status).toBe(401); expect((await json(await call("Bearer wrong-secret-xxxxxx"))).status).toBe(401)
      expect((await json(await call("Bearer test-cron-secret-123"))).body.data).toEqual({ expired: 0 })
    } finally { delete process.env.CRON_SECRET }
  })
})
