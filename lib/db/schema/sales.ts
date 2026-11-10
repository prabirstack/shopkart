import { sql } from "drizzle-orm"
import { boolean, check, index, integer, jsonb, pgSequence, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { id, timestamps } from "./common"
import { couponKind, orderStatus, paymentStatus, returnStatus } from "./enums"
import { products } from "./catalog"
import { users } from "./identity"

export const orderNumberSeq = pgSequence("order_number_seq", { startWith: 10500 })
export const returnNumberSeq = pgSequence("return_number_seq", { startWith: 2100 })

export type ShippingAddress = { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string }

export const coupons = pgTable("coupons", {
  id: id(),
  code: text("code").notNull(),
  kind: couponKind("kind").notNull(),
  /** Percent (1 to 90) for "percent" coupons, or paise for "flat" coupons. */
  value: integer("value").notNull(),
  minOrderPaise: integer("min_order_paise").notNull().default(0),
  usageLimit: integer("usage_limit").notNull(),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (t) => [
  uniqueIndex("coupons_code_idx").on(t.code),
  check("coupons_code_upper", sql`${t.code} = upper(${t.code})`),
  check("coupons_value_valid", sql`(${t.kind} = 'percent' and ${t.value} between 1 and 90) or (${t.kind} = 'flat' and ${t.value} > 0)`),
  check("coupons_usage_within_limit", sql`${t.usedCount} >= 0 and ${t.usedCount} <= ${t.usageLimit}`),
])

export const orders = pgTable("orders", {
  id: id(),
  /** Human-friendly number shown to customers, like SK-10500. */
  number: text("number").notNull().default(sql`'SK-' || nextval('order_number_seq')`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  status: orderStatus("status").notNull().default("pending"),
  subtotalPaise: integer("subtotal_paise").notNull(),
  discountPaise: integer("discount_paise").notNull().default(0),
  shippingPaise: integer("shipping_paise").notNull().default(0),
  /** GST already inside the prices, kept for the invoice. */
  gstIncludedPaise: integer("gst_included_paise").notNull().default(0),
  totalPaise: integer("total_paise").notNull(),
  couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  couponCode: text("coupon_code"),
  /** Client-supplied key. A retried request with the same key returns the original order instead of creating another. */
  idempotencyKey: text("idempotency_key"),
  // Snapshots, so later profile or address edits never rewrite order history.
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  shipTo: jsonb("ship_to").$type<ShippingAddress>().notNull(),
  placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
}, (t) => [
  uniqueIndex("orders_number_idx").on(t.number),
  uniqueIndex("orders_idempotency_idx").on(t.userId, t.idempotencyKey).where(sql`${t.idempotencyKey} is not null`),
  index("orders_user_idx").on(t.userId, t.placedAt),
  index("orders_status_idx").on(t.status, t.placedAt),
  check("orders_amounts_non_negative", sql`${t.subtotalPaise} >= 0 and ${t.discountPaise} >= 0 and ${t.shippingPaise} >= 0 and ${t.totalPaise} >= 0`),
  check("orders_total_adds_up", sql`${t.totalPaise} = ${t.subtotalPaise} - ${t.discountPaise} + ${t.shippingPaise}`),
  check("orders_discount_within_subtotal", sql`${t.discountPaise} <= ${t.subtotalPaise}`),
])

export const orderItems = pgTable("order_items", {
  id: id(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  // Snapshots: the product may be renamed, repriced or archived later; the order must not change.
  title: text("title").notNull(),
  sku: text("sku").notNull(),
  quantity: integer("quantity").notNull(),
  unitPricePaise: integer("unit_price_paise").notNull(),
  gstPercent: smallint("gst_percent").notNull(),
}, (t) => [
  uniqueIndex("order_items_order_product_idx").on(t.orderId, t.productId),
  check("order_items_quantity_positive", sql`${t.quantity} > 0`),
  check("order_items_price_positive", sql`${t.unitPricePaise} > 0`),
])

/** The timeline shown on an order: who moved it to which status, and when. */
export const orderEvents = pgTable("order_events", {
  id: id(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatus("status").notNull(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  /** "Customer", "Razorpay", "Staff"... for events with no user account. */
  actorLabel: text("actor_label").notNull().default("System"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("order_events_order_idx").on(t.orderId, t.createdAt)])

export const payments = pgTable("payments", {
  id: id(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  provider: text("provider").notNull().default("razorpay"),
  providerOrderId: text("provider_order_id").notNull(),
  providerPaymentId: text("provider_payment_id"),
  amountPaise: integer("amount_paise").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: paymentStatus("status").notNull().default("created"),
  method: text("method"),
  signatureVerifiedAt: timestamp("signature_verified_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  ...timestamps,
}, (t) => [
  uniqueIndex("payments_provider_order_idx").on(t.provider, t.providerOrderId),
  uniqueIndex("payments_provider_payment_idx").on(t.provider, t.providerPaymentId).where(sql`${t.providerPaymentId} is not null`),
  // An order can be retried with new payment attempts, but only one can ever be captured.
  uniqueIndex("payments_one_captured_per_order").on(t.orderId).where(sql`${t.status} = 'captured'`),
  index("payments_order_idx").on(t.orderId),
  check("payments_amount_positive", sql`${t.amountPaise} > 0`),
])

/** Inbox of payment-provider webhooks. The unique event id makes a repeated delivery harmless. */
export const webhookEvents = pgTable("webhook_events", {
  id: id(),
  provider: text("provider").notNull(),
  eventId: text("event_id").notNull(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
}, (t) => [uniqueIndex("webhook_events_provider_event_idx").on(t.provider, t.eventId)])

export const returns = pgTable("returns", {
  id: id(),
  number: text("number").notNull().default(sql`'RT-' || nextval('return_number_seq')`),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  status: returnStatus("status").notNull().default("requested"),
  reason: text("reason").notNull(),
  refundPaise: integer("refund_paise").notNull(),
  ...timestamps,
}, (t) => [uniqueIndex("returns_number_idx").on(t.number), index("returns_order_idx").on(t.orderId), index("returns_status_idx").on(t.status), check("returns_refund_non_negative", sql`${t.refundPaise} >= 0`)])

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: id(),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "restrict" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("coupon_redemptions_order_idx").on(t.orderId),
  // One use per customer per coupon.
  uniqueIndex("coupon_redemptions_user_idx").on(t.couponId, t.userId),
])
