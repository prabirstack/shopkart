import { sql } from "drizzle-orm"
import { check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { id } from "./common"
import { stockReason } from "./enums"
import { products } from "./catalog"
import { users } from "./identity"

/**
 * Current stock per product. available = on_hand - reserved.
 * The CHECK constraints mean stock can never go negative and reserved units can never
 * exceed what is on the shelf, whichever code path writes to this table.
 */
export const stockLevels = pgTable("stock_levels", {
  productId: uuid("product_id").primaryKey().references(() => products.id, { onDelete: "cascade" }),
  onHand: integer("on_hand").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
  reorderAt: integer("reorder_at").notNull().default(10),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  check("stock_on_hand_non_negative", sql`${t.onHand} >= 0`),
  check("stock_reserved_non_negative", sql`${t.reserved} >= 0`),
  check("stock_reserved_within_on_hand", sql`${t.reserved} <= ${t.onHand}`),
])

/** Every change to stock is a row here. Stock is never overwritten, so history can always be audited. */
export const stockMovements = pgTable("stock_movements", {
  id: id(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  reason: stockReason("reason").notNull(),
  note: text("note").notNull().default(""),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  /** Optional idempotency key (for example an order number). The same reference is only applied once. */
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("stock_movements_product_idx").on(t.productId, t.createdAt),
  uniqueIndex("stock_movements_reference_idx").on(t.reference, t.reason).where(sql`${t.reference} is not null`),
  check("stock_movement_non_zero", sql`${t.delta} <> 0`),
])
