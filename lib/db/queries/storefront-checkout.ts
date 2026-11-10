import "server-only"

import { and, asc, eq, sql } from "drizzle-orm"

import { db } from "../index"
import { orderEvents, orderItems, orders } from "../schema"

export type TrackedOrder = {
  number: string
  status: "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded"
  /** First name only: the lookup is public, so nothing more personal than that is ever returned. */
  firstName: string
  placedAt: Date
  events: { status: string; at: Date }[]
  items: { title: string; quantity: number }[]
}

/**
 * Public order lookup. It answers only when BOTH the order number and the email on the order match, and
 * returns null in every other case, so a caller cannot tell "no such order" from "wrong email".
 * Staff notes and actor names are never selected.
 */
export async function trackOrder(number: string, email: string): Promise<TrackedOrder | null> {
  const [o] = await db.select().from(orders)
    .where(and(eq(orders.number, number.trim().toUpperCase()), sql`lower(${orders.customerEmail}) = ${email.trim().toLowerCase()}`)).limit(1)
  if (!o) return null
  const [items, events] = await Promise.all([
    db.select({ title: orderItems.title, quantity: orderItems.quantity }).from(orderItems).where(eq(orderItems.orderId, o.id)),
    db.select({ status: orderEvents.status, at: orderEvents.createdAt }).from(orderEvents).where(eq(orderEvents.orderId, o.id)).orderBy(asc(orderEvents.createdAt)),
  ])
  return { number: o.number, status: o.status, firstName: o.customerName.trim().split(/\s+/)[0] ?? "", placedAt: o.placedAt, events, items }
}
