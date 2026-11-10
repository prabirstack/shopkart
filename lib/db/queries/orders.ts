import "server-only"

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "../index"
import { couponRedemptions, coupons, orderEvents, orderItems, orders, payments, products, stockLevels, stockMovements, taxCategories, webhookEvents, type ShippingAddress } from "../schema"
import { quote } from "@/lib/pricing"
import { MAX_QUANTITY } from "@/lib/store-config"
import { couponProblem, toCouponRule } from "./coupons"
import { DomainError, isCheckViolation, isUniqueViolation, pgConstraint } from "./errors"
import type { OrderDTO } from "./types"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Reader = Pick<typeof db, "select">

async function loadOrder(client: Reader, where: ReturnType<typeof eq>): Promise<OrderDTO | null> {
  const [o] = await client.select().from(orders).where(where).limit(1)
  if (!o) return null
  const [items, events, pays] = [
    await client.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
    await client.select().from(orderEvents).where(eq(orderEvents.orderId, o.id)).orderBy(asc(orderEvents.createdAt)),
    await client.select().from(payments).where(eq(payments.orderId, o.id)).orderBy(asc(payments.createdAt)),
  ]
  return {
    id: o.id, number: o.number, status: o.status, subtotalPaise: o.subtotalPaise, discountPaise: o.discountPaise, shippingPaise: o.shippingPaise, gstIncludedPaise: o.gstIncludedPaise, totalPaise: o.totalPaise,
    couponCode: o.couponCode, customerName: o.customerName, customerEmail: o.customerEmail, customerPhone: o.customerPhone, shipTo: o.shipTo, placedAt: o.placedAt,
    items: items.map((i) => ({ productId: i.productId, title: i.title, sku: i.sku, quantity: i.quantity, unitPricePaise: i.unitPricePaise, gstPercent: i.gstPercent })),
    events: events.map((e) => ({ status: e.status, actorLabel: e.actorLabel, note: e.note, at: e.createdAt })),
    payments: pays.map((p) => ({ providerOrderId: p.providerOrderId, providerPaymentId: p.providerPaymentId, amountPaise: p.amountPaise, status: p.status, method: p.method })),
  }
}

export type CreateOrderInput = {
  userId: string
  items: { productId: string; quantity: number }[]
  couponCode?: string | null
  customer: { name: string; email: string; phone: string }
  shipTo: ShippingAddress
  /** The payment provider's order id, so the payment row can be matched later. */
  providerOrderId: string
  /** Optional. Repeating a request with the same key returns the first order. */
  idempotencyKey?: string | null
}

/**
 * Places an order. Everything happens in one transaction, so it either fully succeeds or
 * changes nothing:
 *  1. duplicate products are merged, then stock rows are locked in a fixed order (no deadlocks);
 *  2. every line is checked against available stock (on hand minus reserved);
 *  3. the coupon is validated and its usage counted under a row lock;
 *  4. prices, GST, delivery and the total are computed on the server from database prices;
 *  5. stock is reserved, and the order, items, timeline and a pending payment are written.
 * Two shoppers racing for the last unit cannot both succeed: the second waits for the lock,
 * then sees no stock left.
 */
export async function createOrder(input: CreateOrderInput): Promise<OrderDTO> {
  if (input.idempotencyKey) {
    const existing = await loadOrder(db, and(eq(orders.userId, input.userId), eq(orders.idempotencyKey, input.idempotencyKey)) as ReturnType<typeof eq>)
    if (existing) return existing
  }
  try { return await createOrderOnce(input) } catch (e) {
    // Two identical requests raced: the loser hits the unique key, so return the winner's order.
    if (input.idempotencyKey && isUniqueViolation(e)) {
      const winner = await loadOrder(db, and(eq(orders.userId, input.userId), eq(orders.idempotencyKey, input.idempotencyKey)) as ReturnType<typeof eq>)
      if (winner) return winner
    }
    throw e
  }
}

async function createOrderOnce(input: CreateOrderInput): Promise<OrderDTO> {
  const merged = new Map<string, number>()
  for (const { productId, quantity } of input.items) {
    if (!Number.isInteger(quantity) || quantity < 1) throw new DomainError("INVALID_QUANTITY", "Invalid quantity in your cart.")
    merged.set(productId, (merged.get(productId) ?? 0) + quantity)
  }
  if (merged.size === 0) throw new DomainError("EMPTY_CART", "Your cart is empty.")
  const ids = [...merged.keys()].sort()

  try {
    return await db.transaction(async (tx: Tx) => {
      const stock = await tx.select().from(stockLevels).where(inArray(stockLevels.productId, ids)).orderBy(asc(stockLevels.productId)).for("update")
      const prods = await tx.select({ id: products.id, title: products.title, sku: products.sku, pricePaise: products.pricePaise, status: products.status, gst: taxCategories.ratePercent })
        .from(products).innerJoin(taxCategories, eq(taxCategories.id, products.taxCategoryId)).where(inArray(products.id, ids))

      const lines = ids.map((id) => {
        const p = prods.find((x) => x.id === id)
        const st = stock.find((x) => x.productId === id)
        const quantity = merged.get(id)!
        if (!p || p.status !== "published" || !st) throw new DomainError("PRODUCT_UNAVAILABLE", "A product in your cart is no longer available.")
        if (quantity > MAX_QUANTITY) throw new DomainError("QUANTITY_LIMIT", `You can buy at most ${MAX_QUANTITY} of ${p.title}.`)
        const available = st.onHand - st.reserved
        if (quantity > available) throw new DomainError("OUT_OF_STOCK", available <= 0 ? `${p.title} is out of stock.` : `Only ${available} of ${p.title} in stock.`)
        return { productId: id, title: p.title, sku: p.sku, quantity, pricePaise: p.pricePaise, gstPercent: Number(p.gst) }
      })
      const subtotal = lines.reduce((s, l) => s + l.pricePaise * l.quantity, 0)

      let coupon: typeof coupons.$inferSelect | undefined
      if (input.couponCode) {
        ;[coupon] = await tx.select().from(coupons).where(eq(coupons.code, input.couponCode.trim().toUpperCase())).for("update")
        const problem = couponProblem(coupon, subtotal, new Date())
        if (problem) throw new DomainError("COUPON_INVALID", problem)
      }
      const totals = quote(lines.map((l) => ({ pricePaise: l.pricePaise, quantity: l.quantity, gstPercent: l.gstPercent })), coupon ? toCouponRule(coupon) : null)

      for (const l of lines) await tx.update(stockLevels).set({ reserved: sql`${stockLevels.reserved} + ${l.quantity}` }).where(eq(stockLevels.productId, l.productId))

      const [order] = await tx.insert(orders).values({
        userId: input.userId, subtotalPaise: totals.subtotalPaise, discountPaise: totals.discountPaise, shippingPaise: totals.shippingPaise, gstIncludedPaise: totals.gstIncludedPaise, totalPaise: totals.totalPaise,
        couponId: coupon && totals.discountPaise > 0 ? coupon.id : null, couponCode: coupon && totals.discountPaise > 0 ? coupon.code : null, idempotencyKey: input.idempotencyKey ?? null,
        customerName: input.customer.name, customerEmail: input.customer.email, customerPhone: input.customer.phone, shipTo: input.shipTo,
      }).returning()
      await tx.insert(orderItems).values(lines.map((l) => ({ orderId: order.id, productId: l.productId, title: l.title, sku: l.sku, quantity: l.quantity, unitPricePaise: l.pricePaise, gstPercent: l.gstPercent })))
      await tx.insert(orderEvents).values({ orderId: order.id, status: "pending", actorLabel: "Customer", note: "Order placed", actorId: input.userId })
      await tx.insert(payments).values({ orderId: order.id, providerOrderId: input.providerOrderId, amountPaise: order.totalPaise, status: "created" })

      if (coupon && totals.discountPaise > 0) {
        const used = await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(and(eq(coupons.id, coupon.id), sql`${coupons.usedCount} < ${coupons.usageLimit}`)).returning({ id: coupons.id })
        if (used.length === 0) throw new DomainError("COUPON_INVALID", "This coupon has been fully used.")
        await tx.insert(couponRedemptions).values({ couponId: coupon.id, userId: input.userId, orderId: order.id })
      }
      return (await loadOrder(tx, eq(orders.id, order.id)))!
    })
  } catch (e) {
    // Only the one-use-per-customer rule means "coupon already used"; other unique keys (idempotency) must pass through.
    if (isUniqueViolation(e) && pgConstraint(e)?.startsWith("coupon_redemptions")) throw new DomainError("COUPON_INVALID", "You've already used this coupon.")
    if (isCheckViolation(e)) throw new DomainError("OUT_OF_STOCK", "Someone just bought the last of an item in your cart.")
    throw e
  }
}

/**
 * Confirms a verified payment. Safe to call twice for the same payment (a retried request or a
 * repeated webhook): the second call finds the payment already captured and does nothing.
 * The first call marks the order paid, records the event and turns the reservation into a sale.
 * The caller must have verified the provider's signature before calling this.
 */
export async function markOrderPaid(input: { providerOrderId: string; providerPaymentId: string; amountPaise: number; method?: string; /** When set, the order must belong to this user. */ onlyForUserId?: string }): Promise<{ order: OrderDTO; alreadyPaid: boolean }> {
  return db.transaction(async (tx: Tx) => {
    const [pay] = await tx.select().from(payments).where(and(eq(payments.provider, "razorpay"), eq(payments.providerOrderId, input.providerOrderId))).for("update")
    if (!pay) throw new DomainError("PAYMENT_NOT_FOUND", "No payment is waiting for this order.")
    const order = (await loadOrder(tx, eq(orders.id, pay.orderId)))!
    if (input.onlyForUserId) {
      const [owner] = await tx.select({ userId: orders.userId }).from(orders).where(eq(orders.id, pay.orderId))
      if (owner?.userId !== input.onlyForUserId) throw new DomainError("PAYMENT_NOT_FOUND", "No payment is waiting for this order.")
    }
    if (pay.status === "captured") return { order, alreadyPaid: true }
    if (pay.amountPaise !== input.amountPaise) throw new DomainError("AMOUNT_MISMATCH", "The paid amount does not match the order total.")
    if (order.status !== "pending") throw new DomainError("ORDER_NOT_PAYABLE", `Order ${order.number} is ${order.status} and can no longer be paid.`)

    await tx.update(payments).set({ status: "captured", providerPaymentId: input.providerPaymentId, method: input.method ?? pay.method, signatureVerifiedAt: new Date() }).where(eq(payments.id, pay.id))
    await tx.update(orders).set({ status: "paid" }).where(eq(orders.id, order.id))
    await tx.insert(orderEvents).values({ orderId: order.id, status: "paid", actorLabel: "Razorpay", note: "Payment confirmed" })
    for (const item of order.items) {
      // The reserved units leave the shelf for good: on hand and reserved both drop.
      await tx.update(stockLevels).set({ onHand: sql`${stockLevels.onHand} - ${item.quantity}`, reserved: sql`${stockLevels.reserved} - ${item.quantity}` }).where(eq(stockLevels.productId, item.productId))
      await tx.insert(stockMovements).values({ productId: item.productId, delta: -item.quantity, reason: "sale", note: `Order ${order.number}`, reference: order.number })
    }
    return { order: (await loadOrder(tx, eq(orders.id, order.id)))!, alreadyPaid: false }
  })
}

/** Staff status flow. Payment and cancellation have their own functions. */
const NEXT: Record<string, string[]> = { paid: ["packed"], packed: ["shipped"], shipped: ["delivered"] }

export async function advanceOrder(input: { number: string; to: "packed" | "shipped" | "delivered"; actorId: string | null; actorLabel?: string }): Promise<OrderDTO> {
  return db.transaction(async (tx: Tx) => {
    const [o] = await tx.select().from(orders).where(eq(orders.number, input.number)).for("update")
    if (!o) throw new DomainError("NOT_FOUND", "Order not found.")
    if (!(NEXT[o.status] ?? []).includes(input.to)) throw new DomainError("INVALID_TRANSITION", `An order that is ${o.status} can't move to ${input.to}.`)
    await tx.update(orders).set({ status: input.to }).where(eq(orders.id, o.id))
    await tx.insert(orderEvents).values({ orderId: o.id, status: input.to, actorId: input.actorId, actorLabel: input.actorLabel ?? "Staff" })
    return (await loadOrder(tx, eq(orders.id, o.id)))!
  })
}

/**
 * Cancels an order that has not shipped. A pending order just releases its reservation. A paid
 * or packed order returns its units to stock. Refunding the customer's money is a separate
 * payment-provider step, noted on the timeline.
 */
export async function cancelOrder(input: { number: string; actorId: string | null; actorLabel?: string; /** Customers: the order must be theirs. Checked after the row is locked. */ onlyForUserId?: string; /** Only cancel from these statuses. Checked after the row is locked, so a payment landing meanwhile is respected. */ onlyStatuses?: OrderDTO["status"][]; statusMessage?: string }): Promise<OrderDTO> {
  return db.transaction(async (tx: Tx) => {
    const [o] = await tx.select().from(orders).where(eq(orders.number, input.number)).for("update")
    // A stranger gets the same answer as a missing order, so order numbers can't be probed.
    if (!o || (input.onlyForUserId && o.userId !== input.onlyForUserId)) throw new DomainError("NOT_FOUND", "Order not found.")
    if (input.onlyStatuses && !input.onlyStatuses.includes(o.status)) throw new DomainError("INVALID_TRANSITION", input.statusMessage ?? `An order that is ${o.status} can't be cancelled.`)
    if (!["pending", "paid", "packed"].includes(o.status)) throw new DomainError("INVALID_TRANSITION", `An order that is ${o.status} can't be cancelled.`)
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, o.id))
    for (const i of items) {
      if (o.status === "pending") await tx.update(stockLevels).set({ reserved: sql`${stockLevels.reserved} - ${i.quantity}` }).where(eq(stockLevels.productId, i.productId))
      else {
        await tx.update(stockLevels).set({ onHand: sql`${stockLevels.onHand} + ${i.quantity}` }).where(eq(stockLevels.productId, i.productId))
        await tx.insert(stockMovements).values({ productId: i.productId, delta: i.quantity, reason: "return", note: `Cancelled order ${o.number}`, reference: o.number })
      }
    }
    await tx.update(orders).set({ status: "cancelled" }).where(eq(orders.id, o.id))
    await tx.insert(orderEvents).values({ orderId: o.id, status: "cancelled", actorId: input.actorId, actorLabel: input.actorLabel ?? "Staff", note: o.status === "pending" ? "Cancelled before payment" : "Cancelled. Refund to be issued to the original payment method." })
    return (await loadOrder(tx, eq(orders.id, o.id)))!
  })
}

/** A customer's own order. Ownership is part of the query itself: another customer's order number returns null. */
export async function getOrderForUser(number: string, userId: string): Promise<OrderDTO | null> {
  return loadOrder(db, and(eq(orders.number, number), eq(orders.userId, userId)) as ReturnType<typeof eq>)
}

export async function listOrdersForUser(userId: string): Promise<OrderDTO[]> {
  const rows = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.placedAt))
  return (await Promise.all(rows.map((r) => loadOrder(db, eq(orders.id, r.id))))).filter((o): o is OrderDTO => o !== null)
}

/** Staff view. The caller must already have checked the actor's permission. */
export async function getOrderByNumber(number: string): Promise<OrderDTO | null> {
  return loadOrder(db, eq(orders.number, number))
}

/**
 * Records a webhook delivery before acting on it and says what to do with it:
 *  - "new":   first time we see this event id, process it;
 *  - "retry": seen before but never finished (we crashed or failed midway), process it again;
 *  - "done":  already processed, acknowledge without acting.
 * Handlers are idempotent, so re-processing is safe; what must never happen is a received-but-unprocessed
 * event being treated as finished, because the provider would stop retrying and a payment would be lost.
 */
export async function recordWebhook(input: { provider: string; eventId: string; type: string; payload: unknown }): Promise<"new" | "retry" | "done"> {
  const rows = await db.insert(webhookEvents).values({ provider: input.provider, eventId: input.eventId, type: input.type, payload: input.payload as never }).onConflictDoNothing().returning({ id: webhookEvents.id })
  if (rows.length > 0) return "new"
  const [existing] = await db.select({ processedAt: webhookEvents.processedAt }).from(webhookEvents).where(and(eq(webhookEvents.provider, input.provider), eq(webhookEvents.eventId, input.eventId)))
  return existing?.processedAt ? "done" : "retry"
}

export async function markWebhookProcessed(provider: string, eventId: string) {
  await db.update(webhookEvents).set({ processedAt: new Date() }).where(and(eq(webhookEvents.provider, provider), eq(webhookEvents.eventId, eventId)))
}

/** A failed payment attempt. The order stays pending so the customer can retry; a captured payment is never downgraded. */
export async function markPaymentFailed(input: { providerOrderId: string; reason: string }) {
  await db.update(payments).set({ status: "failed", failureReason: input.reason.slice(0, 300) }).where(and(eq(payments.provider, "razorpay"), eq(payments.providerOrderId, input.providerOrderId), eq(payments.status, "created")))
}

/** The amount we are expecting for a provider order, taken from our own payment row. */
export async function pendingAmount(providerOrderId: string): Promise<{ amountPaise: number }> {
  const [p] = await db.select({ amountPaise: payments.amountPaise }).from(payments).where(and(eq(payments.provider, "razorpay"), eq(payments.providerOrderId, providerOrderId))).limit(1)
  if (!p) throw new DomainError("PAYMENT_NOT_FOUND", "No payment is waiting for this order.")
  return p
}
