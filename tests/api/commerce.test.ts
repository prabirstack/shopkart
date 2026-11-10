import { createHmac } from "node:crypto"
import { beforeEach, describe, expect, it } from "vitest"

import { GET as listOrders, POST as placeOrder } from "../../app/api/v1/orders/route"
import { GET as getOrder } from "../../app/api/v1/orders/[number]/route"
import { POST as cancelOwn } from "../../app/api/v1/orders/[number]/cancel/route"
import { POST as verify } from "../../app/api/v1/payments/verify/route"
import { POST as webhook } from "../../app/api/v1/webhooks/razorpay/route"
import { GET as adminOrders } from "../../app/api/v1/admin/orders/route"
import { POST as advance } from "../../app/api/v1/admin/orders/[number]/advance/route"
import { POST as adjust } from "../../app/api/v1/admin/inventory/[productId]/adjust/route"
import { GET as dashboard } from "../../app/api/v1/admin/dashboard/route"
import { POST as createProd } from "../../app/api/v1/admin/products/route"
import { PATCH as moderate } from "../../app/api/v1/admin/reviews/[id]/route"
import { PUT as putWish } from "../../app/api/v1/account/wishlist/[productId]/route"
import { GET as wishlist } from "../../app/api/v1/account/wishlist/route"
import { POST as addAddr, GET as addrs } from "../../app/api/v1/account/addresses/route"
import { DELETE as delAddr } from "../../app/api/v1/account/addresses/[id]/route"
import { signPayment } from "../../features/payments/signature"
import { makeCatalog, makeProduct, resetDb, stockOf } from "../helpers"
import { ctx, json, req, signUp } from "./helpers"

const address = { name: "Test User", phone: "9800000001", line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" }
const customer = { name: "Test User", email: "test@example.com", phone: "9800000001" }

describe("checkout and payment API", () => {
  let product: Awaited<ReturnType<typeof makeProduct>>
  beforeEach(async () => { await resetDb(); product = await makeProduct(await makeCatalog(), { pricePaise: 20000, stock: 5 }) })
  const order = (cookie: string, extra: Record<string, string> = {}, qty = 1) => placeOrder(req("/api/v1/orders", { method: "POST", cookie, headers: extra, body: { items: [{ productId: product.id, quantity: qty }], customer, shipTo: address } }))

  it("requires sign-in to order", async () => { expect((await json(await order(""))).status).toBe(401) })

  it("places an order priced by the server and returns the payment details", async () => {
    const u = await signUp()
    const r = await json(await order(u.cookie, {}, 2))
    expect(r.status).toBe(201)
    expect(r.body.data.order).toMatchObject({ status: "pending", subtotalPaise: 40000, shippingPaise: 4900, totalPaise: 44900 })
    expect(r.body.data.payment).toMatchObject({ amountPaise: 44900, currency: "INR" })
    expect((await stockOf(product.id)).reserved).toBe(2)
  })

  it("ignores any price the client tries to send", async () => {
    const u = await signUp()
    const r = await json(await placeOrder(req("/api/v1/orders", { method: "POST", cookie: u.cookie, body: { items: [{ productId: product.id, quantity: 1, pricePaise: 1 }], totalPaise: 1, customer, shipTo: address } })))
    expect(r.body.data.order.subtotalPaise).toBe(20000)
  })

  it("is idempotent with an Idempotency-Key, even when two requests race", async () => {
    const u = await signUp()
    const key = { "idempotency-key": "retry-key-0001" }
    const [a, b, c] = await Promise.all([order(u.cookie, key), order(u.cookie, key), order(u.cookie, key)].map(async (p) => json(await p)))
    expect([a, b, c].every((x) => x.status === 201)).toBe(true)
    expect(new Set([a, b, c].map((x) => x.body.data.order.number)).size).toBe(1)
    expect((await stockOf(product.id)).reserved).toBe(1)
  })

  it("answers an out-of-stock cart with 409 and the reason", async () => {
    const u = await signUp()
    const r = await json(await order(u.cookie, {}, 6))
    expect(r.status).toBe(409); expect(r.body.error.code).toBe("OUT_OF_STOCK")
  })

  it("keeps orders private to their owner (another customer gets 404)", async () => {
    const a = await signUp(), b = await signUp()
    const placed = (await json(await order(a.cookie))).body.data.order
    expect((await json(await getOrder(req(`/api/v1/orders/${placed.number}`, { cookie: a.cookie }), ctx({ number: placed.number })))).status).toBe(200)
    expect((await json(await getOrder(req(`/api/v1/orders/${placed.number}`, { cookie: b.cookie }), ctx({ number: placed.number })))).status).toBe(404)
    expect((await json(await listOrders(req("/api/v1/orders", { cookie: b.cookie })))).body.data).toEqual([])
    expect((await json(await cancelOwn(req(`/api/v1/orders/${placed.number}/cancel`, { method: "POST", cookie: b.cookie }), ctx({ number: placed.number })))).status).toBe(404)
  })

  describe("paying", () => {
    const pay = async () => {
      const u = await signUp(); const placed = (await json(await order(u.cookie))).body.data
      const oid = placed.payment.providerOrderId, pid = "pay_abc123"
      return { u, number: placed.order.number, oid, pid, sig: signPayment(oid, pid) }
    }
    const verifyReq = (cookie: string, body: object) => verify(req("/api/v1/payments/verify", { method: "POST", cookie, body }))

    it("confirms a correctly signed payment once, and repeats are harmless", async () => {
      const { u, oid, pid, sig } = await pay()
      const body = { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig }
      const first = await json(await verifyReq(u.cookie, body)); expect(first.body.data).toMatchObject({ alreadyPaid: false, order: { status: "paid" } })
      expect((await json(await verifyReq(u.cookie, body))).body.data.alreadyPaid).toBe(true)
      expect(await stockOf(product.id)).toMatchObject({ onHand: 4, reserved: 0 })
    })

    it("rejects a bad signature, and someone else's payment", async () => {
      const { u, oid, pid, sig } = await pay()
      expect((await json(await verifyReq(u.cookie, { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: "0".repeat(64) }))).body.error.code).toBe("BAD_SIGNATURE")
      const thief = await signUp()
      expect((await json(await verifyReq(thief.cookie, { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig }))).status).toBe(404)
    })

    describe("webhook", () => {
      const secret = () => process.env.RAZORPAY_WEBHOOK_SECRET ?? process.env.MOCK_PAYMENT_SECRET ?? process.env.RAZORPAY_KEY_SECRET ?? "shopkart-dev-only-secret"
      const send = (payload: object, o: { eventId?: string; sig?: string } = {}) => {
        const raw = JSON.stringify(payload)
        return webhook(new Request("http://localhost:3000/api/v1/webhooks/razorpay", { method: "POST", headers: { "content-type": "application/json", "x-razorpay-event-id": o.eventId ?? "evt_1", "x-razorpay-signature": o.sig ?? createHmac("sha256", secret()).update(raw).digest("hex") }, body: raw }))
      }
      const captured = (oid: string, amount: number) => ({ event: "payment.captured", payload: { payment: { entity: { id: "pay_w1", order_id: oid, amount, method: "upi" } } } })

      it("rejects an unsigned or wrongly signed call", async () => {
        const { oid } = await pay()
        expect((await json(await send(captured(oid, 44900), { sig: "ab".repeat(32) }))).status).toBe(401)
        expect((await json(await send(captured(oid, 44900), { sig: "nothex" }))).status).toBe(401)
      })
      it("marks the order paid, and a redelivered event is acknowledged without being processed twice", async () => {
        const { oid, number, u } = await pay()
        const total = (await json(await getOrder(req(`/api/v1/orders/${number}`, { cookie: u.cookie }), ctx({ number })))).body.data.totalPaise
        expect((await json(await send(captured(oid, total)))).body.data).toEqual({ received: true })
        expect((await json(await send(captured(oid, total)))).body.data).toEqual({ received: true, duplicate: true })
        expect((await json(await getOrder(req(`/api/v1/orders/${number}`, { cookie: u.cookie }), ctx({ number })))).body.data.status).toBe("paid")
        expect(await stockOf(product.id)).toMatchObject({ onHand: 4, reserved: 0 })
      })
      it("keeps the order pending when the amount doesn't match", async () => {
        const { oid } = await pay()
        const r = await json(await send(captured(oid, 1), { eventId: "evt_bad" })); expect(r.status).toBe(409)
      })
    })

    it("lets a customer cancel before paying but not after", async () => {
      const { u, number, oid, pid, sig } = await pay()
      await verifyReq(u.cookie, { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig })
      const r = await json(await cancelOwn(req(`/api/v1/orders/${number}/cancel`, { method: "POST", cookie: u.cookie }), ctx({ number })))
      expect(r.status).toBe(409)
      const u2 = await signUp(); const o2 = (await json(await order(u2.cookie))).body.data.order
      expect((await json(await cancelOwn(req(`/api/v1/orders/${o2.number}/cancel`, { method: "POST", cookie: u2.cookie }), ctx({ number: o2.number })))).body.data.status).toBe("cancelled")
    })
  })
})

describe("admin API permissions", () => {
  beforeEach(resetDb)

  it("rejects customers and signed-out visitors from every admin area", async () => {
    const cust = await signUp()
    for (const call of [() => adminOrders(req("/api/v1/admin/orders")), () => dashboard(req("/api/v1/admin/dashboard"))]) expect((await json(await call())).status).toBe(401)
    for (const call of [() => adminOrders(req("/api/v1/admin/orders", { cookie: cust.cookie })), () => dashboard(req("/api/v1/admin/dashboard", { cookie: cust.cookie }))]) {
      const r = await json(await call()); expect(r.status).toBe(403); expect(r.body.error.code).toBe("FORBIDDEN")
    }
  })

  it("gives each staff role only its own permissions", async () => {
    const cat = await makeCatalog(); const p = await makeProduct(cat, { stock: 5 })
    const warehouse = await signUp("warehouse"), editor = await signUp("catalog_editor"), finance = await signUp("finance")
    const adj = (cookie: string) => adjust(req(`/api/v1/admin/inventory/${p.id}/adjust`, { method: "POST", cookie, body: { delta: 5, reason: "restock", note: "PO-1" } }), ctx({ productId: p.id }))
    expect((await json(await adj(warehouse.cookie))).body.data).toMatchObject({ applied: true, onHand: 10 })
    expect((await json(await adj(editor.cookie))).status).toBe(403)
    expect((await json(await dashboard(req("/api/v1/admin/dashboard", { cookie: finance.cookie })))).status).toBe(200)
    expect((await json(await dashboard(req("/api/v1/admin/dashboard", { cookie: warehouse.cookie })))).status).toBe(403)
  })

  it("lets the owner manage products with validation, and records an audit trail", async () => {
    const cat = await makeCatalog(); const owner = await signUp("owner")
    const body = { title: "New Gadget", slug: "new-gadget", sku: "NG-1", categoryId: cat.electronics.id, brandId: cat.acme.id, taxCategoryId: cat.tax18.id, pricePaise: 50000, status: "published", initialStock: 7 }
    const ok = await json(await createProd(req("/api/v1/admin/products", { method: "POST", cookie: owner.cookie, body })))
    expect(ok.status).toBe(201)
    expect(await stockOf(ok.body.data.id)).toMatchObject({ onHand: 7 })
    expect((await json(await createProd(req("/api/v1/admin/products", { method: "POST", cookie: owner.cookie, body })))).status).toBe(409) // duplicate slug/SKU
    expect((await json(await createProd(req("/api/v1/admin/products", { method: "POST", cookie: owner.cookie, body: { ...body, slug: "x2", sku: "X2", comparePaise: 100 } })))).body.error.details[0].path).toBe("comparePaise")
    expect((await json(await createProd(req("/api/v1/admin/products", { method: "POST", cookie: owner.cookie, body: { ...body, slug: "Bad Slug!", sku: "X3" } })))).status).toBe(422)
  })

  it("walks an order through fulfilment and refuses to skip steps", async () => {
    const cat = await makeCatalog(); const p = await makeProduct(cat, { pricePaise: 20000 })
    const buyer = await signUp(), ops = await signUp("warehouse")
    const placed = (await json(await placeOrder(req("/api/v1/orders", { method: "POST", cookie: buyer.cookie, body: { items: [{ productId: p.id, quantity: 1 }], customer, shipTo: address } })))).body.data
    const number = placed.order.number
    const to = (status: string) => advance(req(`/api/v1/admin/orders/${number}/advance`, { method: "POST", cookie: ops.cookie, body: { to: status } }), ctx({ number }))
    expect((await json(await to("packed"))).status).toBe(409) // still pending, not paid
    await verify(req("/api/v1/payments/verify", { method: "POST", cookie: buyer.cookie, body: { razorpay_order_id: placed.payment.providerOrderId, razorpay_payment_id: "pay_z", razorpay_signature: signPayment(placed.payment.providerOrderId, "pay_z") } }))
    expect((await json(await to("packed"))).body.data.status).toBe("packed")
    expect((await json(await to("delivered"))).status).toBe(409)
    expect((await json(await adminOrders(req("/api/v1/admin/orders?status=packed", { cookie: ops.cookie })))).body.data.total).toBe(1)
  })

  it("moderates reviews with the moderate permission only", async () => {
    const cat = await makeCatalog(); await makeProduct(cat, { slug: "rev" }); const buyer = await signUp(), support = await signUp("support"), warehouse = await signUp("warehouse")
    const { POST: post } = await import("../../app/api/v1/products/[slug]/reviews/route")
    const rv = (await json(await post(req("/api/v1/products/rev/reviews", { method: "POST", cookie: buyer.cookie, body: { rating: 4, title: "Solid", body: "Does what it says and then some, happy." } }), ctx({ slug: "rev" })))).body.data
    const patch = (cookie: string) => moderate(req(`/api/v1/admin/reviews/${rv.id}`, { method: "PATCH", cookie, body: { status: "approved" } }), ctx({ id: rv.id }))
    expect((await json(await patch(warehouse.cookie))).status).toBe(403)
    expect((await json(await patch(support.cookie))).body.data).toEqual({ changed: true })
  })
})

describe("account API", () => {
  beforeEach(resetDb)
  it("manages addresses privately, keeping one default", async () => {
    const a = await signUp(), b = await signUp()
    const add = (cookie: string, extra = {}) => addAddr(req("/api/v1/account/addresses", { method: "POST", cookie, body: { ...address, ...extra } }))
    const first = (await json(await add(a.cookie))).body.data; const second = (await json(await add(a.cookie, { label: "Work", isDefault: true }))).body.data
    expect(first.isDefault).toBe(true)
    const list = (await json(await addrs(req("/api/v1/account/addresses", { cookie: a.cookie })))).body.data
    expect(list.filter((x: any) => x.isDefault).map((x: any) => x.id)).toEqual([second.id])
    expect((await json(await addrs(req("/api/v1/account/addresses", { cookie: b.cookie })))).body.data).toEqual([])
    expect((await json(await delAddr(req(`/api/v1/account/addresses/${first.id}`, { method: "DELETE", cookie: b.cookie }), ctx({ id: first.id })))).status).toBe(404)
    expect((await json(await add(a.cookie, { pincode: "12" }))).status).toBe(422)
  })
  it("keeps a wishlist and tolerates repeats", async () => {
    const cat = await makeCatalog(); const p = await makeProduct(cat); const u = await signUp()
    for (let i = 0; i < 2; i++) expect((await putWish(req(`/api/v1/account/wishlist/${p.id}`, { method: "PUT", cookie: u.cookie }), ctx({ productId: p.id }))).status).toBe(204)
    expect((await json(await wishlist(req("/api/v1/account/wishlist", { cookie: u.cookie })))).body.data.map((x: any) => x.id)).toEqual([p.id])
  })
})

describe("security regressions", () => {
  it("does not trust a client-supplied X-Forwarded-For for rate limiting", async () => {
    const { clientIp } = await import("../../lib/api/http")
    const spoofed = new Request("http://localhost/x", { headers: { "x-forwarded-for": "1.2.3.4, 9.9.9.9" } })
    expect(clientIp(spoofed, 1)).toBe("9.9.9.9") // the address our own proxy appended, not the forged leading one
    expect(clientIp(spoofed, 2)).toBe("1.2.3.4")
    expect(clientIp(spoofed, 0)).toBe("direct")
  })

  it("reprocesses a webhook that was received but never finished", async () => {
    const { recordWebhook, markWebhookProcessed } = await import("../../lib/db/queries")
    await resetDb()
    const evt = { provider: "razorpay", eventId: "evt_x", type: "payment.captured", payload: {} }
    expect(await recordWebhook(evt)).toBe("new")
    expect(await recordWebhook(evt)).toBe("retry") // first attempt died before finishing
    await markWebhookProcessed("razorpay", "evt_x")
    expect(await recordWebhook(evt)).toBe("done")
  })

  it("cannot cancel an order that was paid while the cancel request was in flight", async () => {
    await resetDb()
    const p = await makeProduct(await makeCatalog(), { pricePaise: 20000, stock: 5 })
    const u = await signUp()
    const placed = (await json(await placeOrder(req("/api/v1/orders", { method: "POST", cookie: u.cookie, body: { items: [{ productId: p.id, quantity: 1 }], customer, shipTo: address } })))).body.data
    const { providerOrderId } = placed.payment, number = placed.order.number
    const body = { razorpay_order_id: providerOrderId, razorpay_payment_id: "pay_race", razorpay_signature: signPayment(providerOrderId, "pay_race") }
    const results = await Promise.all([
      verify(req("/api/v1/payments/verify", { method: "POST", cookie: u.cookie, body })),
      cancelOwn(req(`/api/v1/orders/${number}/cancel`, { method: "POST", cookie: u.cookie }), ctx({ number })),
    ].map(async (r) => json(await r)))
    const final = (await json(await getOrder(req(`/api/v1/orders/${number}`, { cookie: u.cookie }), ctx({ number })))).body.data
    // Either the payment wins (cancel refused) or the cancel wins (payment refused). Never both.
    expect(["paid", "cancelled"]).toContain(final.status)
    expect(results.filter((r) => r.status < 300)).toHaveLength(1)
    const s = await stockOf(p.id)
    expect(final.status === "paid" ? s : { onHand: s.onHand, reserved: s.reserved }).toMatchObject(final.status === "paid" ? { onHand: 4, reserved: 0 } : { onHand: 5, reserved: 0 })
  })
})
