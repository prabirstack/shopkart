import { beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { advanceOrder, cancelOrder, createOrder, getOrderForUser, listOrdersForUser, markOrderPaid } from "../../lib/db/queries"
import { address, customer, makeCatalog, makeCoupon, makeProduct, makeUser, resetDb, stockOf } from "../helpers"

let n = 0
const place = (userId: string, items: { productId: string; quantity: number }[], couponCode?: string) =>
  createOrder({ userId, items, couponCode, customer, shipTo: address, providerOrderId: `order_t${++n}` })

describe("orders", () => {
  let cat: Awaited<ReturnType<typeof makeCatalog>>
  let user: Awaited<ReturnType<typeof makeUser>>
  beforeEach(async () => { await resetDb(); cat = await makeCatalog(); user = await makeUser() })

  it("prices the order on the server from database prices and reserves stock", async () => {
    const p = await makeProduct(cat, { pricePaise: 20000, stock: 10 })
    const o = await place(user.id, [{ productId: p.id, quantity: 2 }])
    expect(o).toMatchObject({ status: "pending", subtotalPaise: 40000, discountPaise: 0, shippingPaise: 4900, totalPaise: 44900 })
    expect(o.number).toMatch(/^SK-\d+$/)
    expect(o.items[0]).toMatchObject({ title: p.title, quantity: 2, unitPricePaise: 20000, gstPercent: 18 })
    expect(o.payments[0]).toMatchObject({ status: "created", amountPaise: 44900 })
    expect(await stockOf(p.id)).toMatchObject({ onHand: 10, reserved: 2 })
  })

  it("gives free delivery from the threshold up", async () => {
    const p = await makeProduct(cat, { pricePaise: 70000 })
    expect((await place(user.id, [{ productId: p.id, quantity: 1 }])).shippingPaise).toBe(0)
  })

  it("merges duplicate lines so the stock limit can't be bypassed", async () => {
    const p = await makeProduct(cat, { stock: 3 })
    await expect(place(user.id, [{ productId: p.id, quantity: 2 }, { productId: p.id, quantity: 2 }])).rejects.toMatchObject({ code: "OUT_OF_STOCK" })
    expect(await stockOf(p.id)).toMatchObject({ reserved: 0 })
  })

  it("rejects bad carts: empty, bad quantity, over the per-order limit, draft or missing products", async () => {
    const p = await makeProduct(cat, { stock: 100 }); const draft = await makeProduct(cat, { status: "draft" })
    await expect(place(user.id, [])).rejects.toMatchObject({ code: "EMPTY_CART" })
    await expect(place(user.id, [{ productId: p.id, quantity: 0 }])).rejects.toMatchObject({ code: "INVALID_QUANTITY" })
    await expect(place(user.id, [{ productId: p.id, quantity: 11 }])).rejects.toMatchObject({ code: "QUANTITY_LIMIT" })
    await expect(place(user.id, [{ productId: draft.id, quantity: 1 }])).rejects.toMatchObject({ code: "PRODUCT_UNAVAILABLE" })
  })

  it("is all-or-nothing: one out-of-stock line reserves nothing and creates no order", async () => {
    const a = await makeProduct(cat, { stock: 5 }); const b = await makeProduct(cat, { stock: 1 })
    await expect(place(user.id, [{ productId: a.id, quantity: 2 }, { productId: b.id, quantity: 2 }])).rejects.toMatchObject({ code: "OUT_OF_STOCK" })
    expect(await stockOf(a.id)).toMatchObject({ reserved: 0 })
    expect(await db.select().from(s.orders)).toHaveLength(0)
  })

  it("lets only one of two simultaneous shoppers buy the last unit", async () => {
    const p = await makeProduct(cat, { stock: 1 }); const other = await makeUser()
    const results = await Promise.allSettled([place(user.id, [{ productId: p.id, quantity: 1 }]), place(other.id, [{ productId: p.id, quantity: 1 }])])
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    const lost = results.find((r) => r.status === "rejected") as PromiseRejectedResult
    expect(lost.reason).toMatchObject({ code: "OUT_OF_STOCK" })
    expect(await stockOf(p.id)).toMatchObject({ onHand: 1, reserved: 1 })
  })

  it("never oversells under heavy concurrency", async () => {
    const p = await makeProduct(cat, { stock: 5 })
    const users = await Promise.all(Array.from({ length: 12 }, () => makeUser()))
    const results = await Promise.allSettled(users.map((u) => place(u.id, [{ productId: p.id, quantity: 1 }])))
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5)
    expect((await stockOf(p.id)).reserved).toBe(5)
  })

  describe("coupons", () => {
    it("applies a valid coupon, counts the use and records the redemption", async () => {
      const p = await makeProduct(cat, { pricePaise: 100000 }); const c = await makeCoupon({ code: "TEN", value: 10 })
      const o = await place(user.id, [{ productId: p.id, quantity: 1 }], "ten")
      expect(o).toMatchObject({ couponCode: "TEN", discountPaise: 10000, totalPaise: 90000 })
      expect((await db.select().from(s.coupons).where(eq(s.coupons.id, c.id)))[0].usedCount).toBe(1)
      expect(await db.select().from(s.couponRedemptions)).toHaveLength(1)
    })

    it("rejects unknown, expired, inactive, not-yet-started, exhausted and under-minimum coupons", async () => {
      const p = await makeProduct(cat, { pricePaise: 100000 }); const lines = [{ productId: p.id, quantity: 1 }]
      await makeCoupon({ code: "OLD", expiresAt: new Date(Date.now() - 1000) })
      await makeCoupon({ code: "OFF", isActive: false })
      await makeCoupon({ code: "SOON", startsAt: new Date(Date.now() + 86_400_000) })
      await makeCoupon({ code: "FULL", usageLimit: 1, usedCount: 1 })
      await makeCoupon({ code: "BIG", minOrderPaise: 500000 })
      for (const code of ["NOPE", "OLD", "OFF", "SOON", "FULL", "BIG"]) await expect(place(user.id, lines, code)).rejects.toMatchObject({ code: "COUPON_INVALID" })
      expect(await stockOf(p.id)).toMatchObject({ reserved: 0 })
    })

    it("allows each customer one use, and never exceeds the usage limit", async () => {
      const p = await makeProduct(cat, { pricePaise: 100000, stock: 50 }); const lines = [{ productId: p.id, quantity: 1 }]
      await makeCoupon({ code: "ONCE", usageLimit: 2 })
      await place(user.id, lines, "ONCE")
      await expect(place(user.id, lines, "ONCE")).rejects.toMatchObject({ code: "COUPON_INVALID" })
      const users = await Promise.all([makeUser(), makeUser(), makeUser()])
      const r = await Promise.allSettled(users.map((u) => place(u.id, lines, "ONCE")))
      expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1) // 1 used + 1 more = limit of 2
      const [c] = await db.select().from(s.coupons); expect(c.usedCount).toBe(2)
    })
  })

  describe("payment", () => {
    it("marks paid once: reserved units become a sale, repeats change nothing", async () => {
      const p = await makeProduct(cat, { stock: 10, pricePaise: 50000 })
      const o = await place(user.id, [{ productId: p.id, quantity: 3 }])
      const pay = { providerOrderId: o.payments[0].providerOrderId, providerPaymentId: "pay_1", amountPaise: o.totalPaise, method: "upi" }
      const first = await markOrderPaid(pay)
      expect(first.alreadyPaid).toBe(false); expect(first.order.status).toBe("paid")
      expect(await stockOf(p.id)).toMatchObject({ onHand: 7, reserved: 0 })
      const [again, concurrent] = await Promise.all([markOrderPaid(pay), markOrderPaid(pay)])
      expect(again.alreadyPaid && concurrent.alreadyPaid).toBe(true)
      expect(await stockOf(p.id)).toMatchObject({ onHand: 7, reserved: 0 })
      const sales = (await db.select().from(s.stockMovements)).filter((m) => m.reason === "sale"); expect(sales).toHaveLength(1)
      expect((await getOrderForUser(o.number, user.id))!.events.map((e) => e.status)).toEqual(["pending", "paid"])
    })

    it("handles simultaneous first confirmations without double-counting", async () => {
      const p = await makeProduct(cat, { stock: 10 })
      const o = await place(user.id, [{ productId: p.id, quantity: 2 }])
      const pay = { providerOrderId: o.payments[0].providerOrderId, providerPaymentId: "pay_x", amountPaise: o.totalPaise }
      const r = await Promise.all([markOrderPaid(pay), markOrderPaid(pay), markOrderPaid(pay)])
      expect(r.filter((x) => !x.alreadyPaid)).toHaveLength(1)
      expect(await stockOf(p.id)).toMatchObject({ onHand: 8, reserved: 0 })
    })

    it("rejects a wrong amount, an unknown payment and a cancelled order", async () => {
      const p = await makeProduct(cat); const o = await place(user.id, [{ productId: p.id, quantity: 1 }])
      const id = o.payments[0].providerOrderId
      await expect(markOrderPaid({ providerOrderId: id, providerPaymentId: "p", amountPaise: 1 })).rejects.toMatchObject({ code: "AMOUNT_MISMATCH" })
      await expect(markOrderPaid({ providerOrderId: "missing", providerPaymentId: "p", amountPaise: 1 })).rejects.toMatchObject({ code: "PAYMENT_NOT_FOUND" })
      await cancelOrder({ number: o.number, actorId: null })
      await expect(markOrderPaid({ providerOrderId: id, providerPaymentId: "p", amountPaise: o.totalPaise })).rejects.toMatchObject({ code: "ORDER_NOT_PAYABLE" })
    })
  })

  describe("fulfilment and cancellation", () => {
    const paid = async () => {
      const p = await makeProduct(cat, { stock: 10 }); const o = await place(user.id, [{ productId: p.id, quantity: 2 }])
      await markOrderPaid({ providerOrderId: o.payments[0].providerOrderId, providerPaymentId: `pay_${o.number}`, amountPaise: o.totalPaise })
      return { p, o }
    }

    it("moves paid -> packed -> shipped -> delivered, and refuses to skip steps", async () => {
      const { o } = await paid()
      await expect(advanceOrder({ number: o.number, to: "shipped", actorId: null })).rejects.toMatchObject({ code: "INVALID_TRANSITION" })
      await advanceOrder({ number: o.number, to: "packed", actorId: null })
      await advanceOrder({ number: o.number, to: "shipped", actorId: null })
      expect((await advanceOrder({ number: o.number, to: "delivered", actorId: null })).events.map((e) => e.status)).toEqual(["pending", "paid", "packed", "shipped", "delivered"])
      await expect(cancelOrder({ number: o.number, actorId: null })).rejects.toMatchObject({ code: "INVALID_TRANSITION" })
    })

    it("cancelling a pending order releases the reservation", async () => {
      const p = await makeProduct(cat, { stock: 4 }); const o = await place(user.id, [{ productId: p.id, quantity: 3 }])
      expect(await stockOf(p.id)).toMatchObject({ onHand: 4, reserved: 3 })
      expect((await cancelOrder({ number: o.number, actorId: null })).status).toBe("cancelled")
      expect(await stockOf(p.id)).toMatchObject({ onHand: 4, reserved: 0 })
    })

    it("cancelling a paid order puts the units back on the shelf", async () => {
      const { p, o } = await paid()
      expect(await stockOf(p.id)).toMatchObject({ onHand: 8 })
      await cancelOrder({ number: o.number, actorId: null })
      expect(await stockOf(p.id)).toMatchObject({ onHand: 10, reserved: 0 })
      await expect(cancelOrder({ number: o.number, actorId: null })).rejects.toMatchObject({ code: "INVALID_TRANSITION" })
    })
  })

  it("keeps order history intact when the product changes later, and scopes orders to their owner", async () => {
    const p = await makeProduct(cat, { title: "Original Title", pricePaise: 50000 })
    const o = await place(user.id, [{ productId: p.id, quantity: 1 }])
    await db.update(s.products).set({ title: "Renamed", pricePaise: 99999 }).where(eq(s.products.id, p.id))
    const again = (await getOrderForUser(o.number, user.id))!
    expect(again.items[0]).toMatchObject({ title: "Original Title", unitPricePaise: 50000 })
    const stranger = await makeUser()
    expect(await getOrderForUser(o.number, stranger.id)).toBeNull()
    expect(await listOrdersForUser(stranger.id)).toEqual([])
    expect((await listOrdersForUser(user.id)).map((x) => x.number)).toEqual([o.number])
  })
})
