import type { OrderDTO } from "@/lib/db/queries/types"

// Shared by the account screens: what each order status is called, how far along it is, and what "paid" means.
export type OrderStatus = OrderDTO["status"]

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment", paid: "Paid", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
}
export const STATUS_TONE: Record<OrderStatus, "info" | "warn" | "good" | "muted" | "bad"> = {
  pending: "warn", paid: "info", packed: "info", shipped: "info", delivered: "good", cancelled: "bad", refunded: "muted",
}
export const STATUS_FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "paid", label: "Paid" }, { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" }, { value: "delivered", label: "Delivered" }, { value: "cancelled", label: "Cancelled" }, { value: "refunded", label: "Refunded" },
]

/** The happy path an order walks through. Each step is an order status. */
export const TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Placed" }, { status: "paid", label: "Paid" }, { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" }, { status: "delivered", label: "Delivered" },
]
const STEP: Record<OrderStatus, number> = { pending: 1, paid: 2, packed: 3, shipped: 4, delivered: 5, cancelled: 0, refunded: 0 }

/** How many timeline steps are complete. Cancelled and refunded orders are judged by the steps they actually reached. */
export function stepsDone(order: { status: OrderStatus; events: { status: string }[] }): number {
  if (order.status !== "cancelled" && order.status !== "refunded") return STEP[order.status]
  return Math.max(1, ...order.events.map((e) => STEP[e.status as OrderStatus] ?? 0))
}

/** Orders that are in flight: paid but not yet delivered. */
export const isInProgress = (s: OrderStatus) => s === "paid" || s === "packed" || s === "shipped"

/** True when money was received at some point (so an invoice exists), even if it was refunded afterwards. */
export const wasPaid = (o: Pick<OrderDTO, "status" | "events" | "payments">) =>
  ["paid", "packed", "shipped", "delivered", "refunded"].includes(o.status) || o.events.some((e) => e.status === "paid") || o.payments.some((p) => p.status === "captured")

/** Money kept by the store: paid orders that were not refunded or cancelled. */
export const countsAsSpent = (s: OrderStatus) => s === "paid" || s === "packed" || s === "shipped" || s === "delivered"

export const invoiceNumber = (orderNumber: string) => `INV-${orderNumber.replace(/^SK-/, "")}`

const date = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
const month = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
export const formatDate = (d: Date | string) => date.format(new Date(d))
export const formatMonthYear = (d: Date | string) => month.format(new Date(d))

/** How the customer paid, from the captured payment. */
export function paymentOf(o: Pick<OrderDTO, "payments">) {
  const p = o.payments.find((x) => x.status === "captured")
  return p ? { method: p.method ?? "Online payment", reference: p.providerPaymentId ?? p.providerOrderId } : null
}
