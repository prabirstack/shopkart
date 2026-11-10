import type { AdminOrder } from "./types"

/** What the customer paid: line totals, minus any discount, plus shipping. Matches the database rule on orders. */
export const orderTotal = (o: AdminOrder) => o.lines.reduce((t, l) => t + l.pricePaise * l.quantity, 0) - o.discountPaise + o.shippingPaise
