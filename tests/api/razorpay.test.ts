import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { eq } from "drizzle-orm"

import { POST as placeOrder } from "../../app/api/v1/orders/route"
import { POST as verify } from "../../app/api/v1/payments/verify/route"
import { GET as paymentConfig } from "../../app/api/v1/payments/config/route"
import { POST as refund } from "../../app/api/v1/admin/orders/[number]/refund/route"
import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { createHmac } from "node:crypto"
import { signPayment } from "../../features/payments/signature"
import { address, customer, makeCatalog, makeProduct, makeUser, resetDb, stockOf } from "../helpers"
import { ctx, json, req, signUp } from "./helpers"

// Real-Razorpay mode against a STUBBED Razorpay API: no network, no keys of value.
const KEY_ID = "rzp_test_unitTestKey", KEY_SECRET = "unit_test_key_secret"
type Call = { url: string; body: Record<string, unknown>; auth: string | null }
let calls: Call[]
let razorpay: (call: Call) => { status: number; body: unknown }
const realFetch = globalThis.fetch

beforeEach(async () => {
  await resetDb()
  process.env.ENABLE_MOCK_PAYMENTS = ""; process.env.RAZORPAY_KEY_ID = KEY_ID; process.env.RAZORPAY_KEY_SECRET = KEY_SECRET
  calls = []
  razorpay = (c) => (c.url.endsWith("/orders") ? { status: 200, body: { id: "order_RzpTest1", amount: c.body.amount, currency: "INR" } } : { status: 200, body: { id: "rfnd_Test1" } })
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (!url.startsWith("https://api.razorpay.com/")) return realFetch(input, init)
    const call = { url, body: JSON.parse(String(init?.body ?? "{}")), auth: new Headers(init?.headers).get("authorization") }
    calls.push(call); const r = razorpay(call)
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { "content-type": "application/json" } })
  }))
})
afterEach(() => { vi.unstubAllGlobals(); process.env.ENABLE_MOCK_PAYMENTS = "1"; process.env.RAZORPAY_KEY_ID = ""; process.env.RAZORPAY_KEY_SECRET = "" })

async function setup() {
  const cat = await makeCatalog(); const p = await makeProduct(cat, { pricePaise: 20000, stock: 5 }); const u = await signUp()
  const place = (extra: Record<string, string> = {}) => placeOrder(req("/api/v1/orders", { method: "POST", cookie: u.cookie, headers: extra, body: { items: [{ productId: p.id, quantity: 2 }], customer, shipTo: address } }))
  return { p, u, place }
}

describe("real Razorpay mode", () => {
  it("reports the mode and the public key id, never the secret", async () => {
    const r = await json(await paymentConfig(req("/api/v1/payments/config")))
    expect(r.body.data).toEqual({ mode: "razorpay", keyId: KEY_ID, testMode: true })
    expect(JSON.stringify(r.body)).not.toContain(KEY_SECRET)
  })

  it("saves the order, creates the matching Razorpay order for the stored total, and attaches its id", async () => {
    const { p, place } = await setup()
    const r = await json(await place())
    expect(r.status).toBe(201)
    expect(r.body.data.payment).toMatchObject({ providerOrderId: "order_RzpTest1", amountPaise: 44900, currency: "INR", mode: "razorpay", keyId: KEY_ID })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe("https://api.razorpay.com/v1/orders")
    expect(calls[0].body).toMatchObject({ amount: 44900, currency: "INR", receipt: r.body.data.order.number })
    expect(calls[0].auth).toBe(`Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`)
    expect((await db.select().from(s.payments))[0].providerOrderId).toBe("order_RzpTest1")
    expect(await stockOf(p.id)).toMatchObject({ reserved: 2 })
  })

  it("cancels the order and releases stock when Razorpay can't be reached, and tells the shopper nothing was charged", async () => {
    const { p, place } = await setup()
    razorpay = () => ({ status: 500, body: { error: { description: "Internal error" } } })
    const r = await json(await place())
    expect(r.status).toBe(502); expect(r.body.error.code).toBe("PAYMENT_UNAVAILABLE"); expect(r.body.error.message).toMatch(/Nothing was charged/)
    expect(JSON.stringify(r.body)).not.toContain(KEY_SECRET)
    expect((await db.select().from(s.orders))[0].status).toBe("cancelled")
    expect(await stockOf(p.id)).toMatchObject({ reserved: 0 })
  })

  it("rejects an order when Razorpay returns an amount that doesn't match", async () => {
    const { place } = await setup()
    razorpay = (c) => ({ status: 200, body: { id: "order_Wrong", amount: Number(c.body.amount) + 1, currency: "INR" } })
    expect((await json(await place())).status).toBe(502)
  })

  it("a retried request with the same Idempotency-Key reuses the order and does not create a second Razorpay order", async () => {
    const { place } = await setup()
    const key = { "idempotency-key": "rzp-retry-key-1" }
    const a = await json(await place(key)), b = await json(await place(key))
    expect(a.body.data.order.number).toBe(b.body.data.order.number); expect(b.body.data.payment.providerOrderId).toBe("order_RzpTest1")
    expect(calls).toHaveLength(1)
  })

  it("finishes a half-made order on retry: saved, but the first attempt never reached Razorpay", async () => {
    const { u, place } = await setup()
    razorpay = () => { throw new Error("network down") }
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => { if (String(input).startsWith("https://api.razorpay.com/")) throw new TypeError("fetch failed"); return realFetch(input, init) }))
    expect((await json(await place({ "idempotency-key": "rzp-half-made-1" }))).status).toBe(502)
    void u // the failed attempt cancelled itself; a fresh attempt starts cleanly
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!String(input).startsWith("https://api.razorpay.com/")) return realFetch(input, init)
      const body = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ id: "order_RzpTest2", amount: body.amount, currency: "INR" }), { status: 200 })
    }))
    expect((await json(await place())).body.data.payment.providerOrderId).toBe("order_RzpTest2")
  })

  it("confirms a payment signed with the real key secret, and refuses the dummy gateway's signature", async () => {
    const { u, place } = await setup()
    const placed = (await json(await place())).body.data
    const body = (sig: string) => ({ razorpay_order_id: "order_RzpTest1", razorpay_payment_id: "pay_RealOne", razorpay_signature: sig })
    const call = (sig: string) => verify(req("/api/v1/payments/verify", { method: "POST", cookie: u.cookie, body: body(sig) }))
    // What an attacker would do: sign with the dummy gateway's secret. It must not be accepted for a real order.
    const forged = createHmac("sha256", "test-mock-secret").update("order_RzpTest1|pay_RealOne").digest("hex")
    expect((await json(await call(forged))).body.error.code).toBe("BAD_SIGNATURE")
    expect((await json(await call("0".repeat(64)))).status).toBe(400)
    const ok = await json(await call(signPayment("order_RzpTest1", "pay_RealOne")))
    expect(ok.body.data.order.status).toBe("paid"); expect(ok.body.data.order.number).toBe(placed.order.number)
  })

  it("refuses to take orders at all when no gateway is configured", async () => {
    const { place, p } = await setup()
    process.env.RAZORPAY_KEY_ID = ""; process.env.RAZORPAY_KEY_SECRET = ""
    const r = await json(await place())
    expect(r.status).toBe(503); expect(r.body.error.code).toBe("PAYMENTS_NOT_CONFIGURED")
    expect(await db.select().from(s.orders)).toHaveLength(0); expect(await stockOf(p.id)).toMatchObject({ reserved: 0 })
  })
})

describe("refunds", () => {
  async function deliveredOrder(providerPaymentId: string) {
    const u = await makeUser(); const cat = await makeCatalog(); const p = await makeProduct(cat)
    const [o] = await db.insert(s.orders).values({ userId: u.id, status: "delivered", customerName: "Test User", customerEmail: "t@x.com", customerPhone: "9800000001", shipTo: address, subtotalPaise: 50000, totalPaise: 50000 }).returning()
    await db.insert(s.orderItems).values({ orderId: o.id, productId: p.id, title: p.title, sku: p.sku, quantity: 1, unitPricePaise: 50000, gstPercent: 18 })
    await db.insert(s.payments).values({ orderId: o.id, providerOrderId: `order_${o.number}`, providerPaymentId, amountPaise: 50000, status: "captured" })
    return o
  }
  const refundCall = async (number: string) => { const staff = await signUp("finance"); return refund(req(`/api/v1/admin/orders/${number}/refund`, { method: "POST", cookie: staff.cookie }), ctx({ number })) }

  it("sends the money back through Razorpay first, then records the refund with its id", async () => {
    const o = await deliveredOrder("pay_RealPaid1")
    const r = await json(await refundCall(o.number))
    expect(r.status).toBe(200); expect(r.body.data.status).toBe("refunded")
    expect(calls).toHaveLength(1); expect(calls[0].url).toBe("https://api.razorpay.com/v1/payments/pay_RealPaid1/refund"); expect(calls[0].body).toMatchObject({ amount: 50000 })
    const [pay] = await db.select().from(s.payments).where(eq(s.payments.orderId, o.id)); expect(pay).toMatchObject({ status: "refunded", providerRefundId: "rfnd_Test1" })
  })

  it("leaves the order untouched when Razorpay refuses or is down, so the books never claim a refund that didn't happen", async () => {
    const o = await deliveredOrder("pay_RealPaid2")
    razorpay = () => ({ status: 400, body: { error: { description: "The payment has already been fully refunded" } } })
    const r = await json(await refundCall(o.number))
    expect(r.status).toBe(502); expect(r.body.error.code).toBe("REFUND_FAILED"); expect(r.body.error.message).toMatch(/already been fully refunded/)
    expect((await db.select().from(s.orders).where(eq(s.orders.id, o.id)))[0].status).toBe("delivered")
    razorpay = () => ({ status: 503, body: {} })
    expect((await json(await refundCall(o.number))).body.error.message).toMatch(/try again/)
  })

  it("only records (no gateway call) for a payment that came from the dummy gateway", async () => {
    const o = await deliveredOrder("pay_mock_abc123")
    expect((await json(await refundCall(o.number))).body.data.status).toBe("refunded"); expect(calls).toHaveLength(0)
  })

  it("won't try to refund a real payment when Razorpay isn't configured", async () => {
    const o = await deliveredOrder("pay_RealPaid3"); process.env.RAZORPAY_KEY_ID = ""; process.env.RAZORPAY_KEY_SECRET = ""
    expect((await json(await refundCall(o.number))).status).toBe(503); expect(calls).toHaveLength(0)
  })
})
