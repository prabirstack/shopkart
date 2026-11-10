import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { eq } from "drizzle-orm"

import { GET as listReturns, POST as requestReturn } from "../../app/api/v1/orders/[number]/returns/route"
import { GET as eligibility } from "../../app/api/v1/orders/[number]/returns/eligibility/route"
import { POST as cancelReturn } from "../../app/api/v1/returns/[number]/cancel/route"
import { PATCH as setStatus } from "../../app/api/v1/admin/returns/[id]/route"
import { POST as refundOrder } from "../../app/api/v1/admin/orders/[number]/refund/route"
import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { RETURN_WINDOW_DAYS } from "../../lib/store-config"
import { address, makeCatalog, makeProduct, resetDb, stockOf } from "../helpers"
import { ctx, json, req, signUp } from "./helpers"

// Customer returns, end to end through the real route handlers and database. Razorpay is a stub (no network).
const KEY_ID = "rzp_test_unitTestKey", KEY_SECRET = "unit_test_key_secret"
type Call = { url: string; body: Record<string, unknown>; key: string | null }
let gatewayDelayMs = 0
let calls: Call[]
let razorpay: (call: Call) => { status: number; body: unknown }
const realFetch = globalThis.fetch
let catalog: Awaited<ReturnType<typeof makeCatalog>> | undefined

beforeEach(async () => {
  await resetDb(); catalog = undefined
  process.env.ENABLE_MOCK_PAYMENTS = "1"; process.env.RAZORPAY_KEY_ID = KEY_ID; process.env.RAZORPAY_KEY_SECRET = KEY_SECRET
  calls = []; gatewayDelayMs = 0
  razorpay = () => ({ status: 200, body: { id: "rfnd_Test1" } })
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (!url.startsWith("https://api.razorpay.com/")) return realFetch(input, init)
    const call = { url, body: JSON.parse(String(init?.body ?? "{}")), key: new Headers(init?.headers).get("x-refund-idempotency") }
    calls.push(call); const r = razorpay(call)
    if (gatewayDelayMs) await new Promise((done) => setTimeout(done, gatewayDelayMs)) // a slow gateway: the window a double click used to slip through
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { "content-type": "application/json" } })
  }))
})
afterEach(() => { vi.unstubAllGlobals(); process.env.ENABLE_MOCK_PAYMENTS = "1"; process.env.RAZORPAY_KEY_ID = ""; process.env.RAZORPAY_KEY_SECRET = "" })

type Line = { price: number; qty: number }
const DAY = 86_400_000

/** A delivered order for `userId`, with its payment, delivery event and one stocked product per line. */
async function makeOrder(userId: string, o: { lines?: Line[]; discount?: number; deliveredDaysAgo?: number; status?: typeof s.orders.$inferInsert["status"]; paymentId?: string } = {}) {
  catalog ??= await makeCatalog()
  const cat = catalog
  const lines = o.lines ?? [{ price: 50000, qty: 3 }]
  const discount = o.discount ?? 0
  const subtotal = lines.reduce((t, l) => t + l.price * l.qty, 0), total = subtotal - discount
  const status = o.status ?? "delivered"
  const [order] = await db.insert(s.orders).values({ userId, status, customerName: "Test User", customerEmail: "t@x.com", customerPhone: "9800000001", shipTo: address, subtotalPaise: subtotal, discountPaise: discount, totalPaise: total }).returning()
  const products: Awaited<ReturnType<typeof makeProduct>>[] = []
  for (const l of lines) products.push(await makeProduct(cat, { pricePaise: l.price, stock: 10 }))
  const items = await db.insert(s.orderItems).values(lines.map((l, i) => ({ orderId: order.id, productId: products[i].id, title: products[i].title, sku: products[i].sku, quantity: l.qty, unitPricePaise: l.price, gstPercent: 18 }))).returning()
  await db.insert(s.payments).values({ orderId: order.id, providerOrderId: `order_${order.number}`, providerPaymentId: o.paymentId ?? `pay_mock_${order.number}`, amountPaise: total, status: "captured" })
  if (status === "delivered") await db.insert(s.orderEvents).values({ orderId: order.id, status: "delivered", actorLabel: "Staff", createdAt: new Date(Date.now() - (o.deliveredDaysAgo ?? 1) * DAY) })
  return { order, items, products, total }
}

const ask = (cookie: string, number: string, body: unknown) => requestReturn(req(`/api/v1/orders/${number}/returns`, { method: "POST", cookie, body }), ctx({ number }))
const list = (cookie: string, number: string) => listReturns(req(`/api/v1/orders/${number}/returns`, { cookie }), ctx({ number }))
const eligible = (cookie: string, number: string) => eligibility(req(`/api/v1/orders/${number}/returns/eligibility`, { cookie }), ctx({ number }))
const cancel = (cookie: string, number: string) => cancelReturn(req(`/api/v1/returns/${number}/cancel`, { method: "POST", cookie }), ctx({ number }))
const move = (cookie: string, id: string, status: string) => setStatus(req(`/api/v1/admin/returns/${id}`, { method: "PATCH", cookie, body: { status } }), ctx({ id }))
const refundAll = (cookie: string, number: string) => refundOrder(req(`/api/v1/admin/orders/${number}/refund`, { method: "POST", cookie }), ctx({ number }))

async function fileReturn(cookie: string, number: string, items: { orderItemId: string; quantity: number }[], extra: Record<string, unknown> = {}) {
  return json(await ask(cookie, number, { items, reason: "Changed my mind", ...extra }))
}

describe("who may return what", () => {
  it("needs a signed-in customer and only ever shows their own orders", async () => {
    const me = await signUp(), other = await signUp()
    const { order, items } = await makeOrder(me.userId)
    expect((await json(await eligibility(req(`/api/v1/orders/${order.number}/returns/eligibility`), ctx({ number: order.number })))).status).toBe(401)
    expect((await json(await eligible(other.cookie, order.number))).status).toBe(404)
    expect((await json(await list(other.cookie, order.number))).status).toBe(404)
    const stolen = await fileReturn(other.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])
    expect(stolen.status).toBe(404)
    expect(await db.select().from(s.returns)).toHaveLength(0)
  })

  it("refuses orders that are not delivered", async () => {
    const me = await signUp()
    const { order, items } = await makeOrder(me.userId, { status: "shipped" })
    const e = await json(await eligible(me.cookie, order.number))
    expect(e.body.data).toMatchObject({ eligible: false, code: "RETURN_NOT_ELIGIBLE" })
    const r = await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])
    expect(r.status).toBe(409); expect(r.body.error.code).toBe("RETURN_NOT_ELIGIBLE")
  })

  it("closes the window RETURN_WINDOW_DAYS after the delivery event, not after the order was placed", async () => {
    const me = await signUp()
    const open = await makeOrder(me.userId, { deliveredDaysAgo: RETURN_WINDOW_DAYS - 1 })
    const shut = await makeOrder(me.userId, { deliveredDaysAgo: RETURN_WINDOW_DAYS + 1 })
    // Placed long ago but delivered yesterday: still returnable.
    await db.update(s.orders).set({ placedAt: new Date(Date.now() - 30 * DAY) }).where(eq(s.orders.id, open.order.id))

    const ok = await json(await eligible(me.cookie, open.order.number))
    expect(ok.body.data.eligible).toBe(true)
    expect(new Date(ok.body.data.deadline).getTime()).toBeGreaterThan(Date.now())
    expect(ok.body.data.lines).toHaveLength(1); expect(ok.body.data.lines[0]).toMatchObject({ orderItemId: open.items[0].id, quantity: 3, returnable: 3, unitRefundPaise: 50000 })

    const no = await json(await eligible(me.cookie, shut.order.number))
    expect(no.body.data).toMatchObject({ eligible: false, code: "RETURN_WINDOW_CLOSED" }); expect(no.body.data.reason).toMatch(/closed/)
    const r = await fileReturn(me.cookie, shut.order.number, [{ orderItemId: shut.items[0].id, quantity: 1 }])
    expect(r.status).toBe(409); expect(r.body.error.code).toBe("RETURN_WINDOW_CLOSED")
    expect(await db.select().from(s.returns)).toHaveLength(0)
  })
})

describe("what can be returned", () => {
  it("never lets more units go back than were bought, across several returns", async () => {
    const me = await signUp(); const { order, items } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 3 }] })
    const line = items[0].id
    expect((await fileReturn(me.cookie, order.number, [{ orderItemId: line, quantity: 4 }])).status).toBe(422)
    expect((await fileReturn(me.cookie, order.number, [{ orderItemId: line, quantity: 2 }])).status).toBe(201)
    const tooMany = await fileReturn(me.cookie, order.number, [{ orderItemId: line, quantity: 2 }])
    expect(tooMany.status).toBe(422); expect(tooMany.body.error.message).toMatch(/at most 1/)
    const e = await json(await eligible(me.cookie, order.number)); expect(e.body.data.lines[0]).toMatchObject({ returned: 2, returnable: 1 })
    const last = await fileReturn(me.cookie, order.number, [{ orderItemId: line, quantity: 1 }])
    expect(last.status).toBe(201)
    const done = await json(await eligible(me.cookie, order.number)); expect(done.body.data).toMatchObject({ eligible: false, code: "RETURN_ALL_RETURNED" })
    expect((await fileReturn(me.cookie, order.number, [{ orderItemId: line, quantity: 1 }])).status).toBe(422)

    // Cancelling one frees its units again.
    expect((await json(await cancel(me.cookie, last.body.data.number))).status).toBe(200)
    expect((await json(await eligible(me.cookie, order.number))).body.data.lines[0].returnable).toBe(1)
  })

  it("frees the units of a rejected return, but a refunded one keeps them used", async () => {
    const me = await signUp(), staff = await signUp("support")
    const { order, items } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 2 }] })
    const a = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])).body.data
    await move(staff.cookie, a.id, "rejected")
    expect((await json(await eligible(me.cookie, order.number))).body.data.lines[0].returnable).toBe(2)
    const b = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 2 }])).body.data
    for (const st of ["approved", "received", "refunded"]) expect((await json(await move(staff.cookie, b.id, st))).status).toBe(200)
    expect((await json(await eligible(me.cookie, order.number))).body.data.lines[0].returnable).toBe(0)
  })

  it("lists the customer's returns with items and amounts", async () => {
    const me = await signUp(); const { order, items } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 2 }, { price: 5000, qty: 1 }] })
    await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }, { orderItemId: items[1].id, quantity: 1 }], { reason: "Other", note: "Colour is off" })
    const r = await json(await list(me.cookie, order.number))
    expect(r.body.data).toHaveLength(1)
    expect(r.body.data[0]).toMatchObject({ status: "requested", reason: "Other", note: "Colour is off", refundPaise: 25000, orderNumber: order.number })
    expect(r.body.data[0].number).toMatch(/^RT-\d+$/); expect(r.body.data[0].items).toHaveLength(2)
  })
})

describe("the refund amount", () => {
  it("is computed on the server from the stored order, with the discount shared across lines, to the paisa", async () => {
    const me = await signUp()
    // Subtotal 70000, discount 5000. Line A (60000): share round(4285.71) = 4286, net 55714. Line B (10000): share 714, net 9286.
    const { order, items } = await makeOrder(me.userId, { lines: [{ price: 30000, qty: 2 }, { price: 10000, qty: 1 }], discount: 5000 })
    const [a, b] = items
    const e = await json(await eligible(me.cookie, order.number))
    expect(e.body.data.lines.map((l: { lineNetPaise: number }) => l.lineNetPaise).sort()).toEqual([55714, 9286])

    // The client can't set the amount: an extra refundPaise is ignored.
    const one = await fileReturn(me.cookie, order.number, [{ orderItemId: a.id, quantity: 1 }], { refundPaise: 1, amountPaise: 1 })
    expect(one.status).toBe(201); expect(one.body.data.refundPaise).toBe(27857) // round(55714 / 2)
    const rest = await fileReturn(me.cookie, order.number, [{ orderItemId: a.id, quantity: 1 }, { orderItemId: b.id, quantity: 1 }])
    expect(rest.body.data.refundPaise).toBe(27857 + 9286)
    // Shipping is never refunded: the order total is not the sum of the returns.
    expect((await db.select().from(s.returns)).reduce((t, r) => t + r.refundPaise, 0)).toBe(27857 + 27857 + 9286)
  })

  it("refunds the shelf price when there is no discount", async () => {
    const me = await signUp(); const { order, items } = await makeOrder(me.userId, { lines: [{ price: 33333, qty: 3 }] })
    expect((await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 2 }])).body.data.refundPaise).toBe(66666)
  })
})

describe("validation", () => {
  it("checks the reason, the note and the lines", async () => {
    const me = await signUp(); const a = await makeOrder(me.userId), b = await makeOrder(me.userId)
    const line = a.items[0].id
    expect((await fileReturn(me.cookie, a.order.number, [{ orderItemId: line, quantity: 1 }], { reason: "Felt like it" })).status).toBe(422)
    const noNote = await fileReturn(me.cookie, a.order.number, [{ orderItemId: line, quantity: 1 }], { reason: "Other" })
    expect(noNote.status).toBe(422); expect(noNote.body.error.details[0].path).toBe("note")
    expect((await fileReturn(me.cookie, a.order.number, [{ orderItemId: line, quantity: 1 }], { note: "x".repeat(501) })).status).toBe(422)
    expect((await fileReturn(me.cookie, a.order.number, [])).status).toBe(422)
    expect((await fileReturn(me.cookie, a.order.number, [{ orderItemId: line, quantity: 0 }])).status).toBe(422)
    expect((await fileReturn(me.cookie, a.order.number, [{ orderItemId: line, quantity: 1.5 }])).status).toBe(422)
    expect((await fileReturn(me.cookie, a.order.number, [{ orderItemId: line, quantity: 1 }, { orderItemId: line, quantity: 1 }])).status).toBe(422)
    expect((await fileReturn(me.cookie, a.order.number, [{ orderItemId: "not-a-uuid", quantity: 1 }])).status).toBe(422)
    // A line from a different order is not part of this one.
    const foreign = await fileReturn(me.cookie, a.order.number, [{ orderItemId: b.items[0].id, quantity: 1 }])
    expect(foreign.status).toBe(422); expect(foreign.body.error.code).toBe("RETURN_INVALID_ITEM")
    expect(await db.select().from(s.returns)).toHaveLength(0)
    // Every listed reason is accepted, and a note of exactly 500 characters is fine.
    for (const reason of ["Changed my mind", "Wrong item received", "Item arrived damaged", "Not as described", "Wrong size or fit"]) {
      const o = await makeOrder(me.userId); expect((await fileReturn(me.cookie, o.order.number, [{ orderItemId: o.items[0].id, quantity: 1 }], { reason })).status).toBe(201)
    }
    const long = await makeOrder(me.userId)
    expect((await fileReturn(me.cookie, long.order.number, [{ orderItemId: long.items[0].id, quantity: 1 }], { reason: "Other", note: "y".repeat(500) })).status).toBe(201)
  })
})

describe("cancelling a return", () => {
  it("works only for the owner and only while requested", async () => {
    const me = await signUp(), other = await signUp(), staff = await signUp("support")
    const { order, items } = await makeOrder(me.userId)
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])).body.data
    expect((await json(await cancel(other.cookie, r.number))).status).toBe(404)
    expect((await json(await cancelReturn(req(`/api/v1/returns/${r.number}/cancel`, { method: "POST" }), ctx({ number: r.number })))).status).toBe(401)
    const ok = await json(await cancel(me.cookie, r.number)); expect(ok.status).toBe(200); expect(ok.body.data.status).toBe("cancelled")
    expect((await json(await cancel(me.cookie, r.number))).status).toBe(409) // already cancelled
    expect((await json(await move(staff.cookie, r.id, "approved"))).status).toBe(409) // staff can't revive it

    const r2 = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])).body.data
    await move(staff.cookie, r2.id, "approved")
    const late = await json(await cancel(me.cookie, r2.number)); expect(late.status).toBe(409); expect(late.body.error.code).toBe("INVALID_TRANSITION")
    expect((await db.select().from(s.returns).where(eq(s.returns.id, r2.id)))[0].status).toBe("approved")
  })
})

describe("staff processing", () => {
  it("is limited to roles with returns:manage", async () => {
    const me = await signUp(), warehouse = await signUp("warehouse"), support = await signUp("support")
    const { order, items } = await makeOrder(me.userId)
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])).body.data
    expect((await json(await setStatus(req(`/api/v1/admin/returns/${r.id}`, { method: "PATCH", body: { status: "approved" } }), ctx({ id: r.id })))).status).toBe(401)
    expect((await json(await move(me.cookie, r.id, "approved"))).status).toBe(403) // the customer who asked
    expect((await json(await move(warehouse.cookie, r.id, "approved"))).status).toBe(403)
    expect((await db.select().from(s.returns))[0].status).toBe("requested")
    expect((await json(await move(support.cookie, r.id, "approved"))).status).toBe(200)
    expect((await json(await move(support.cookie, r.id, "cancelled"))).status).toBe(422) // only customers cancel
  })

  it("follows the flow and refuses every other step", async () => {
    const me = await signUp(), staff = await signUp("support")
    const { order, items } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 5 }] })
    const make = async () => (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])).body.data.id as string
    const id = await make()
    for (const bad of ["received", "refunded"]) expect((await json(await move(staff.cookie, id, bad))).status).toBe(409)
    expect((await json(await move(staff.cookie, id, "approved"))).status).toBe(200)
    expect((await json(await move(staff.cookie, id, "approved"))).status).toBe(409)
    expect((await json(await move(staff.cookie, id, "refunded"))).status).toBe(409)
    expect((await json(await move(staff.cookie, id, "received"))).status).toBe(200)
    for (const bad of ["approved", "rejected", "received"]) expect((await json(await move(staff.cookie, id, bad))).status).toBe(409)
    expect((await json(await move(staff.cookie, id, "refunded"))).status).toBe(200)
    for (const bad of ["approved", "rejected", "received", "refunded"]) expect((await json(await move(staff.cookie, id, bad))).status).toBe(409)

    const rejected = await make()
    expect((await json(await move(staff.cookie, rejected, "rejected"))).status).toBe(200)
    expect((await json(await move(staff.cookie, rejected, "approved"))).status).toBe(409)
    const approvedThenRejected = await make()
    await move(staff.cookie, approvedThenRejected, "approved")
    expect((await json(await move(staff.cookie, approvedThenRejected, "rejected"))).status).toBe(200)

    const actions = (await db.select().from(s.auditEvents).where(eq(s.auditEvents.entity, "return"))).filter((a) => a.entityId === id).map((a) => (a.after as { status: string }).status)
    expect(actions).toEqual(["approved", "received", "refunded"])
    expect((await db.select().from(s.auditEvents).where(eq(s.auditEvents.entity, "return")))[0]).toMatchObject({ actorId: staff.userId, action: "return.status" })
  })

  it("puts the units back on the shelf once, when the goods are received", async () => {
    const me = await signUp(), staff = await signUp("support")
    const { order, items, products } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 4 }, { price: 9000, qty: 2 }] })
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 3 }, { orderItemId: items[1].id, quantity: 1 }])).body.data
    await move(staff.cookie, r.id, "approved")
    expect(await stockOf(products[0].id)).toMatchObject({ onHand: 10 }) // nothing yet: the goods are still on their way
    const got = await json(await move(staff.cookie, r.id, "received")); expect(got.status).toBe(200)

    expect(await stockOf(products[0].id)).toMatchObject({ onHand: 13 }); expect(await stockOf(products[1].id)).toMatchObject({ onHand: 11 })
    const moves = await db.select().from(s.stockMovements)
    expect(moves).toHaveLength(2)
    expect(moves.find((m) => m.productId === products[0].id)).toMatchObject({ delta: 3, reason: "return", note: `Return ${r.number}`, reference: `${r.number}:${products[0].id}`, actorId: staff.userId })
    const [row] = await db.select().from(s.returns).where(eq(s.returns.id, r.id)); expect(row.receivedAt).not.toBeNull()

    // Repeating the step is refused and adds nothing.
    expect((await json(await move(staff.cookie, r.id, "received"))).status).toBe(409)
    expect(await stockOf(products[0].id)).toMatchObject({ onHand: 13 }); expect(await db.select().from(s.stockMovements)).toHaveLength(2)
    // The audit row says what went back on the shelf.
    const audit = (await db.select().from(s.auditEvents)).find((a) => (a.after as { status?: string }).status === "received")
    expect((audit!.after as { restocked: unknown[] }).restocked).toHaveLength(2)
  })

  it("does not restock twice even if the stock movement for that return already exists", async () => {
    const me = await signUp(), staff = await signUp("support")
    const { order, items, products } = await makeOrder(me.userId)
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 2 }])).body.data
    await db.insert(s.stockMovements).values({ productId: products[0].id, delta: 2, reason: "return", note: "Return earlier", reference: `${r.number}:${products[0].id}` })
    await move(staff.cookie, r.id, "approved"); await move(staff.cookie, r.id, "received")
    expect(await stockOf(products[0].id)).toMatchObject({ onHand: 10 })
  })

  it("does not restock for a rejected return", async () => {
    const me = await signUp(), staff = await signUp("support")
    const { order, items, products } = await makeOrder(me.userId)
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 2 }])).body.data
    await move(staff.cookie, r.id, "approved"); await move(staff.cookie, r.id, "rejected")
    expect(await stockOf(products[0].id)).toMatchObject({ onHand: 10 }); expect(await db.select().from(s.stockMovements)).toHaveLength(0)
  })
})

describe("full-order refunds after returns", () => {
  const finance = () => signUp("finance")

  it("refunds only what is left after refunded returns", async () => {
    const me = await signUp(), staff = await signUp("support"), fin = await finance()
    const { order, items } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 3 }] }) // pays 60000
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])).body.data
    for (const st of ["approved", "received", "refunded"]) await move(staff.cookie, r.id, st)
    const out = await json(await refundAll(fin.cookie, order.number))
    expect(out.status).toBe(200); expect(out.body.data.status).toBe("refunded")
    expect(out.body.data.events.at(-1).note).toMatch(/₹400\.00/) // the remainder: 2 x 20000 paise
  })

  it("sends exactly the remainder through Razorpay for a real payment", async () => {
    const me = await signUp(), staff = await signUp("support"), fin = await finance()
    process.env.ENABLE_MOCK_PAYMENTS = ""
    const { order, items } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 3 }], paymentId: "pay_RealAbc1" })
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])).body.data
    for (const st of ["approved", "received", "refunded"]) await move(staff.cookie, r.id, st)
    expect(calls).toHaveLength(1); calls.length = 0
    expect((await json(await refundAll(fin.cookie, order.number))).status).toBe(200)
    expect(calls).toHaveLength(1); expect(calls[0].url).toBe("https://api.razorpay.com/v1/payments/pay_RealAbc1/refund"); expect(calls[0].body).toMatchObject({ amount: 40000 })
  })

  it("is blocked while any return is still open, and says what to do", async () => {
    const me = await signUp(), staff = await signUp("support"), fin = await finance()
    const { order, items } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 3 }] })
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])).body.data
    for (const st of ["requested", "approved", "received"]) {
      if (st !== "requested") await move(staff.cookie, r.id, st)
      const blocked = await json(await refundAll(fin.cookie, order.number))
      expect(blocked.status).toBe(409); expect(blocked.body.error.code).toBe("RETURN_OPEN"); expect(blocked.body.error.message).toMatch(/return in progress/)
    }
    expect((await db.select().from(s.orders))[0].status).toBe("delivered")
    // Once the return is finished (here: rejected), the full refund goes through for the whole payment.
    const r2 = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 1 }])).body.data
    await move(staff.cookie, r.id, "refunded"); await move(staff.cookie, r2.id, "rejected")
    expect((await json(await refundAll(fin.cookie, order.number))).status).toBe(200)
  })

  it("answers 409 when returns already refunded everything", async () => {
    const me = await signUp(), staff = await signUp("support"), fin = await finance()
    const { order, items } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 2 }] })
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 2 }])).body.data
    for (const st of ["approved", "received", "refunded"]) await move(staff.cookie, r.id, st)
    const none = await json(await refundAll(fin.cookie, order.number))
    expect(none.status).toBe(409); expect(none.body.error.code).toBe("NOTHING_TO_REFUND")
    expect((await db.select().from(s.orders))[0].status).toBe("delivered")
  })

  it("still refunds an order with no returns for the whole payment", async () => {
    const me = await signUp(), fin = await finance(); const { order } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 3 }] })
    expect((await json(await refundAll(fin.cookie, order.number))).body.data.status).toBe("refunded")
  })
})

describe("refunding a return through Razorpay", () => {
  async function receivedReturn(paymentId: string) {
    const me = await signUp(), staff = await signUp("finance")
    const made = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 3 }], discount: 6000, paymentId }) // line net 54000, so 1 unit = 18000
    const r = (await fileReturn(me.cookie, made.order.number, [{ orderItemId: made.items[0].id, quantity: 1 }])).body.data
    await move(staff.cookie, r.id, "approved"); await move(staff.cookie, r.id, "received")
    return { r, staff, ...made }
  }

  it("sends the return's amount as a partial refund first, then records it with the gateway's id in the audit trail", async () => {
    process.env.ENABLE_MOCK_PAYMENTS = ""
    const { r, staff } = await receivedReturn("pay_RealPart1")
    expect(r.refundPaise).toBe(18000)
    const out = await json(await move(staff.cookie, r.id, "refunded"))
    expect(out.status).toBe(200); expect(out.body.data.status).toBe("refunded")
    expect(calls).toHaveLength(1); expect(calls[0].url).toBe("https://api.razorpay.com/v1/payments/pay_RealPart1/refund")
    expect(calls[0].body).toMatchObject({ amount: 18000, notes: { return: r.number } })
    const audit = (await db.select().from(s.auditEvents)).find((a) => (a.after as { status?: string }).status === "refunded")
    expect(audit!.after).toMatchObject({ status: "refunded", refundPaise: 18000, providerRefundId: "rfnd_Test1" })
  })

  it("leaves the return untouched when Razorpay refuses or is down", async () => {
    process.env.ENABLE_MOCK_PAYMENTS = ""
    const { r, staff } = await receivedReturn("pay_RealPart2")
    razorpay = () => ({ status: 400, body: { error: { description: "The payment has already been fully refunded" } } })
    const refused = await json(await move(staff.cookie, r.id, "refunded"))
    expect(refused.status).toBe(502); expect(refused.body.error.code).toBe("REFUND_FAILED"); expect(refused.body.error.message).toMatch(/already been fully refunded/)
    razorpay = () => ({ status: 500, body: { error: { description: "boom" } } })
    expect((await json(await move(staff.cookie, r.id, "refunded"))).body.error.message).toMatch(/try again/)
    expect((await db.select().from(s.returns).where(eq(s.returns.id, r.id)))[0].status).toBe("received")
    razorpay = () => ({ status: 200, body: { id: "rfnd_Retry1" } })
    expect((await json(await move(staff.cookie, r.id, "refunded"))).status).toBe(200) // a retry works
  })

  it("answers 503 when the payment is real but Razorpay isn't configured, and changes nothing", async () => {
    process.env.ENABLE_MOCK_PAYMENTS = ""
    const { r, staff } = await receivedReturn("pay_RealPart3")
    process.env.RAZORPAY_KEY_ID = ""; process.env.RAZORPAY_KEY_SECRET = ""
    const out = await json(await move(staff.cookie, r.id, "refunded"))
    expect(out.status).toBe(503); expect(out.body.error.code).toBe("PAYMENTS_NOT_CONFIGURED")
    expect(calls).toHaveLength(0); expect((await db.select().from(s.returns).where(eq(s.returns.id, r.id)))[0].status).toBe("received")
  })

  it("only records the refund for a dummy-gateway payment, without calling Razorpay", async () => {
    const { r, staff } = await receivedReturn("pay_mock_abc")
    expect((await json(await move(staff.cookie, r.id, "refunded"))).status).toBe(200)
    expect(calls).toHaveLength(0)
  })

  it("never refunds more than the payment still holds", async () => {
    const me = await signUp(), staff = await signUp("finance")
    const { order, items } = await makeOrder(me.userId, { lines: [{ price: 20000, qty: 2 }] })
    const r = (await fileReturn(me.cookie, order.number, [{ orderItemId: items[0].id, quantity: 2 }])).body.data
    await move(staff.cookie, r.id, "approved"); await move(staff.cookie, r.id, "received")
    await db.update(s.payments).set({ amountPaise: 10000 }).where(eq(s.payments.orderId, order.id))
    const out = await json(await move(staff.cookie, r.id, "refunded"))
    expect(out.status).toBe(409); expect(out.body.error.code).toBe("NOTHING_TO_REFUND")
    expect((await db.select().from(s.returns))[0].status).toBe("received")
  })

  it("sends the return id as Razorpay's idempotency key, so even a repeated call could never pay out twice", async () => {
    process.env.ENABLE_MOCK_PAYMENTS = ""
    const { r, staff } = await receivedReturn("pay_RealKey1")
    await move(staff.cookie, r.id, "refunded")
    expect(calls[0].key).toBe(r.id)
  })

  it("pays out once when two admins click Refund on the same return at the same moment", async () => {
    process.env.ENABLE_MOCK_PAYMENTS = ""; gatewayDelayMs = 250
    const { r, staff } = await receivedReturn("pay_RealRace1")
    const both = await Promise.all([0, 1].map(async () => json(await move(staff.cookie, r.id, "refunded"))))
    expect(both.map((x) => x.status).sort()).toEqual([200, 409]) // the loser waits on the lock, then finds it already refunded
    expect(calls).toHaveLength(1) // the gateway was reached once
    expect((await db.select().from(s.returns))[0].status).toBe("refunded")
    expect((await db.select().from(s.auditEvents)).filter((a) => (a.after as { status?: string }).status === "refunded")).toHaveLength(1)
  })

  it("never refunds more than was paid when a return refund and a full-order refund race", async () => {
    process.env.ENABLE_MOCK_PAYMENTS = ""; gatewayDelayMs = 250
    const { r, staff, order } = await receivedReturn("pay_RealRace2")
    const [pay] = await db.select().from(s.payments).where(eq(s.payments.orderId, order.id))
    await Promise.all([json(await move(staff.cookie, r.id, "refunded")), json(await refundAll(staff.cookie, order.number))])
    const sent = calls.reduce((sum, c) => sum + Number(c.body.amount), 0)
    expect(sent).toBeLessThanOrEqual(pay.amountPaise)
    expect(calls.length).toBeLessThanOrEqual(2)
  })
})
