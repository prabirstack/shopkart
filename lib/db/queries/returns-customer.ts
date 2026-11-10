import "server-only"

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "../index"
import { orderEvents, orderItems, orders, returnItems, returns } from "../schema"
import { LIVE_RETURN_STATUSES, lineNetPaise, refundForUnits, type ReturnReason } from "@/lib/returns"
import { RETURN_WINDOW_DAYS } from "@/lib/store-config"
import { DomainError } from "./errors"

// Customer-facing returns: who may return what, how much comes back, and the customer's own requests.
// Staff processing (approve, receive, refund) lives next to the other admin mutations in admin.ts.

type Reader = Pick<typeof db, "select">
type OrderRow = typeof orders.$inferSelect

const DAY_MS = 86_400_000

export type ReturnEligibilityLine = {
  orderItemId: string; productId: string; title: string; unitPricePaise: number
  /** Units bought. */
  quantity: number
  /** Units already in a return that is still alive (not rejected or cancelled). */
  returned: number
  /** Units that can still be put in a new return. */
  returnable: number
  /** What the line is worth after its share of the order discount. The refund for q units is round(lineNetPaise * q / quantity). */
  lineNetPaise: number
  /** Refund for one unit, for display. The server always recomputes the real amount. */
  unitRefundPaise: number
}

export type ReturnEligibility = {
  orderNumber: string
  eligible: boolean
  /** A code the UI can switch on when not eligible: RETURN_NOT_ELIGIBLE, RETURN_WINDOW_CLOSED or RETURN_ALL_RETURNED. */
  code?: "RETURN_NOT_ELIGIBLE" | "RETURN_WINDOW_CLOSED" | "RETURN_ALL_RETURNED"
  reason?: string
  deliveredAt: Date | null
  /** The last moment a return can be requested, or null when the order was not delivered. */
  deadline: Date | null
  windowDays: number
  lines: ReturnEligibilityLine[]
}

export type CustomerReturnDTO = {
  id: string; number: string; orderNumber: string
  status: "requested" | "approved" | "received" | "refunded" | "rejected" | "cancelled"
  reason: string; note: string | null; refundPaise: number
  requestedAt: Date; receivedAt: Date | null
  items: { orderItemId: string; productId: string; title: string; quantity: number; unitPricePaise: number }[]
}

const fmtDay = (d: Date) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(d)

/** When the order reached the customer: the last "delivered" entry on its timeline. */
async function deliveredAt(client: Reader, o: OrderRow): Promise<Date | null> {
  const [e] = await client.select({ at: orderEvents.createdAt }).from(orderEvents).where(and(eq(orderEvents.orderId, o.id), eq(orderEvents.status, "delivered"))).orderBy(desc(orderEvents.createdAt)).limit(1)
  // A delivered order with no timeline entry (imported data): count from when it was last updated rather than refusing it.
  return e?.at ?? (o.status === "delivered" ? o.updatedAt : null)
}

async function eligibilityFor(client: Reader, o: OrderRow, now: Date): Promise<ReturnEligibility> {
  const [items, used] = await Promise.all([
    client.select().from(orderItems).where(eq(orderItems.orderId, o.id)).orderBy(asc(orderItems.title)),
    client.select({ orderItemId: returnItems.orderItemId, units: sql<number>`sum(${returnItems.quantity})::int` }).from(returnItems)
      .innerJoin(returns, eq(returns.id, returnItems.returnId)).where(and(eq(returns.orderId, o.id), inArray(returns.status, [...LIVE_RETURN_STATUSES]))).groupBy(returnItems.orderItemId),
  ])
  const usedBy = new Map(used.map((u) => [u.orderItemId, u.units]))
  const money = items.map((i) => ({ unitPricePaise: i.unitPricePaise, quantity: i.quantity }))
  const lines: ReturnEligibilityLine[] = items.map((i, idx) => {
    const returned = usedBy.get(i.id) ?? 0
    const net = lineNetPaise(money[idx], money, o.discountPaise)
    return { orderItemId: i.id, productId: i.productId, title: i.title, unitPricePaise: i.unitPricePaise, quantity: i.quantity, returned, returnable: Math.max(0, i.quantity - returned), lineNetPaise: net, unitRefundPaise: refundForUnits(net, i.quantity, 1) }
  })
  const base = { orderNumber: o.number, windowDays: RETURN_WINDOW_DAYS, lines }
  if (o.status !== "delivered") {
    return { ...base, eligible: false, code: "RETURN_NOT_ELIGIBLE", reason: o.status === "refunded" ? "This order has already been refunded." : "Only delivered orders can be returned.", deliveredAt: null, deadline: null }
  }
  const at = await deliveredAt(client, o)
  const deadline = at ? new Date(at.getTime() + RETURN_WINDOW_DAYS * DAY_MS) : null
  if (deadline && now.getTime() > deadline.getTime()) {
    return { ...base, eligible: false, code: "RETURN_WINDOW_CLOSED", reason: `The ${RETURN_WINDOW_DAYS}-day return window closed on ${fmtDay(deadline)}.`, deliveredAt: at, deadline }
  }
  if (lines.every((l) => l.returnable === 0)) {
    return { ...base, eligible: false, code: "RETURN_ALL_RETURNED", reason: "Every item on this order is already part of a return.", deliveredAt: at, deadline }
  }
  return { ...base, eligible: true, deliveredAt: at, deadline }
}

async function ownedOrder(client: Reader, number: string, userId: string, lock = false): Promise<OrderRow> {
  const q = client.select().from(orders).where(and(eq(orders.number, number), eq(orders.userId, userId)))
  const [o] = lock ? await q.for("update") : await q
  // Someone else's order answers exactly like a missing one, so order numbers can't be probed.
  if (!o) throw new DomainError("NOT_FOUND", "Order not found.")
  return o
}

/** What can still be returned on one of the customer's own orders, and until when. */
export async function getReturnEligibility(number: string, userId: string, now = new Date()): Promise<ReturnEligibility> {
  return eligibilityFor(db, await ownedOrder(db, number, userId), now)
}

async function loadReturns(client: Reader, where: ReturnType<typeof eq>): Promise<CustomerReturnDTO[]> {
  const rows = await client.select({ r: returns, orderNumber: orders.number }).from(returns).innerJoin(orders, eq(orders.id, returns.orderId)).where(where).orderBy(desc(returns.createdAt), desc(returns.number))
  if (rows.length === 0) return []
  const items = await client.select({ returnId: returnItems.returnId, orderItemId: returnItems.orderItemId, quantity: returnItems.quantity, productId: orderItems.productId, title: orderItems.title, unitPricePaise: orderItems.unitPricePaise })
    .from(returnItems).innerJoin(orderItems, eq(orderItems.id, returnItems.orderItemId)).where(inArray(returnItems.returnId, rows.map((x) => x.r.id))).orderBy(asc(orderItems.title))
  return rows.map(({ r, orderNumber }) => ({
    id: r.id, number: r.number, orderNumber, status: r.status, reason: r.reason, note: r.note, refundPaise: r.refundPaise, requestedAt: r.createdAt, receivedAt: r.receivedAt,
    items: items.filter((i) => i.returnId === r.id).map((i) => ({ orderItemId: i.orderItemId, productId: i.productId, title: i.title, quantity: i.quantity, unitPricePaise: i.unitPricePaise })),
  }))
}

/** The customer's returns for one of their orders, newest first. */
export async function listReturnsForOrder(number: string, userId: string): Promise<CustomerReturnDTO[]> {
  const o = await ownedOrder(db, number, userId)
  return loadReturns(db, eq(returns.orderId, o.id))
}

/**
 * Files a return. Everything is decided here from the stored order: the customer only says which lines, how many
 * units and why. The order row is locked first, so two requests racing for the same units can't both succeed.
 */
export async function createReturn(input: { number: string; userId: string; items: { orderItemId: string; quantity: number }[]; reason: ReturnReason; note?: string }, now = new Date()): Promise<CustomerReturnDTO> {
  return db.transaction(async (tx) => {
    const o = await ownedOrder(tx, input.number, input.userId, true)
    const el = await eligibilityFor(tx, o, now)
    if (!el.eligible && el.code !== "RETURN_ALL_RETURNED") throw new DomainError(el.code ?? "RETURN_NOT_ELIGIBLE", el.reason ?? "This order can't be returned.")
    const byId = new Map(el.lines.map((l) => [l.orderItemId, l]))
    let refund = 0, units = 0
    for (const it of input.items) {
      const line = byId.get(it.orderItemId)
      if (!line) throw new DomainError("RETURN_INVALID_ITEM", "One of the items isn't part of this order.")
      if (!Number.isInteger(it.quantity) || it.quantity < 1) throw new DomainError("INVALID_QUANTITY", "Choose at least one unit.")
      if (it.quantity > line.returnable) throw new DomainError("INVALID_QUANTITY", line.returnable === 0 ? `${line.title} is already in a return.` : `You can return at most ${line.returnable} of ${line.title}.`)
      refund += refundForUnits(line.lineNetPaise, line.quantity, it.quantity); units += it.quantity
    }
    if (units < 1) throw new DomainError("INVALID_QUANTITY", "Choose at least one item to return.")
    const [r] = await tx.insert(returns).values({ orderId: o.id, reason: input.reason, note: input.note?.trim() || null, requestedBy: input.userId, refundPaise: refund }).returning({ id: returns.id })
    await tx.insert(returnItems).values(input.items.map((i) => ({ returnId: r.id, orderItemId: i.orderItemId, quantity: i.quantity })))
    return (await loadReturns(tx, eq(returns.id, r.id)))[0]
  })
}

/** A customer takes back their request. Only possible while we haven't acted on it. */
export async function cancelReturn(input: { returnNumber: string; userId: string }): Promise<CustomerReturnDTO> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select({ id: returns.id }).from(returns).innerJoin(orders, eq(orders.id, returns.orderId)).where(and(eq(returns.number, input.returnNumber), eq(orders.userId, input.userId)))
    if (!row) throw new DomainError("NOT_FOUND", "Return not found.")
    const [r] = await tx.select().from(returns).where(eq(returns.id, row.id)).for("update")
    if (r.status !== "requested") throw new DomainError("INVALID_TRANSITION", r.status === "cancelled" ? "This return was already cancelled." : `This return is ${r.status} and can't be cancelled any more. Contact support if you need help.`)
    await tx.update(returns).set({ status: "cancelled" }).where(eq(returns.id, r.id))
    return (await loadReturns(tx, eq(returns.id, r.id)))[0]
  })
}
