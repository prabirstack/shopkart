import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { POST as placeOrder } from "../../app/api/v1/orders/route"
import { POST as track } from "../../app/api/v1/orders/track/route"
import { POST as cancel } from "../../app/api/v1/orders/[number]/cancel/route"
import { makeCatalog, makeProduct, resetDb } from "../helpers"
import { json, req, signUp } from "./helpers"

const address = { name: "Test User", phone: "9800000001", line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" }
let ipCounter = 0
const lookup = (number: string, email: string, ip = "198.51.100.1") => track(req("/api/v1/orders/track", { method: "POST", headers: { "x-forwarded-for": ip }, body: { number, email } }))

describe("public order tracking", () => {
  let number: string
  let owner: Awaited<ReturnType<typeof signUp>>
  beforeEach(async () => {
    await resetDb()
    const product = await makeProduct(await makeCatalog(), { pricePaise: 20000, stock: 5 })
    owner = await signUp()
    const r = await json(await placeOrder(req("/api/v1/orders", { method: "POST", cookie: owner.cookie, body: { items: [{ productId: product.id, quantity: 1 }], customer: { name: "Asha Verma", email: "Asha@Example.com", phone: "9800000001" }, shipTo: address } })))
    number = r.body.data.order.number
  })
  afterEach(() => { delete process.env.DISABLE_RATE_LIMIT; process.env.DISABLE_RATE_LIMIT = "1" })

  it("returns status, timeline and item titles when the number and email both match", async () => {
    const r = await json(await lookup(number, "asha@example.com"))
    expect(r.status).toBe(200)
    expect(r.body.data).toMatchObject({ number, status: "pending", firstName: "Asha", items: [{ quantity: 1 }] })
    expect(r.body.data.events.length).toBeGreaterThan(0)
  })

  it("accepts the order number in any case and the email in any case", async () => {
    expect((await json(await lookup(number.toLowerCase(), "ASHA@EXAMPLE.COM"))).status).toBe(200)
  })

  it("never returns contact details, the address, prices or staff notes", async () => {
    const text = JSON.stringify((await json(await lookup(number, "asha@example.com"))).body)
    for (const secret of ["asha@example.com", "9800000001", "MG Road", "560001", "Verma", "actorLabel", "note", "totalPaise", "payments"]) expect(text.toLowerCase()).not.toContain(secret.toLowerCase())
  })

  it("answers a wrong email and a missing order identically", async () => {
    const wrongEmail = await json(await lookup(number, "someone-else@example.com"))
    const missing = await json(await lookup("SK-99999999", "asha@example.com"))
    expect(wrongEmail.status).toBe(404)
    expect(missing.status).toBe(wrongEmail.status)
    const strip = (b: { requestId?: string }) => ({ ...b, requestId: undefined })
    expect(strip(missing.body)).toEqual(strip(wrongEmail.body))
  })

  it("rejects a malformed email as a validation error, not a lookup", async () => {
    expect((await json(await lookup(number, "not-an-email"))).status).toBe(422)
  })

  it("still tracks an order after it is cancelled, showing it as cancelled", async () => {
    await cancel(req(`/api/v1/orders/${number}/cancel`, { method: "POST", cookie: owner.cookie }), { params: Promise.resolve({ number }) })
    const r = await json(await lookup(number, "asha@example.com"))
    expect(r.body.data.status).toBe("cancelled")
  })

  it("is rate limited to 10 lookups a minute per client", async () => {
    process.env.DISABLE_RATE_LIMIT = ""
    const ip = `203.0.113.${++ipCounter + 10}`
    const statuses: number[] = []
    for (let i = 0; i < 11; i++) statuses.push((await json(await lookup(number, "x@example.com", ip))).status)
    expect(statuses.slice(0, 10).every((s) => s === 404)).toBe(true)
    expect(statuses[10]).toBe(429)
  })
})

describe("mock payment gateway is development-only", () => {
  const mockRoute = async () => (await import("../../app/api/payments/mock/route")).POST
  const call = async (orderId: string) => (await mockRoute())(req("/api/payments/mock", { method: "POST", body: { orderId, outcome: "success" } }))
  const prev = process.env.ENABLE_MOCK_PAYMENTS
  afterEach(() => { if (prev === undefined) delete process.env.ENABLE_MOCK_PAYMENTS; else process.env.ENABLE_MOCK_PAYMENTS = prev })

  it("returns 404 unless ENABLE_MOCK_PAYMENTS=1", async () => {
    delete process.env.ENABLE_MOCK_PAYMENTS
    expect((await call("order_mock_abc")).status).toBe(404)
  })

  it("only signs order_mock_ ids", async () => {
    process.env.ENABLE_MOCK_PAYMENTS = "1"
    expect((await call("order_mock_abc")).status).toBe(200)
    expect((await call("order_realabc123")).status).toBe(400)
  })

  it("does not accept a mock signature for a non-mock order, nor any mock id when mock mode is off", async () => {
    const { signMockPayment, signPayment, verifyPaymentSignature } = await import("../../features/payments/signature")
    process.env.ENABLE_MOCK_PAYMENTS = "1"
    const mockSig = signMockPayment("order_real123", "pay_1")
    expect(verifyPaymentSignature("order_real123", "pay_1", mockSig)).toBe(false)
    expect(verifyPaymentSignature("order_real123", "pay_1", signPayment("order_real123", "pay_1"))).toBe(true)
    expect(verifyPaymentSignature("order_mock_1", "pay_1", signMockPayment("order_mock_1", "pay_1"))).toBe(true)
    delete process.env.ENABLE_MOCK_PAYMENTS
    expect(verifyPaymentSignature("order_mock_1", "pay_1", mockSig)).toBe(false)
  })
})
