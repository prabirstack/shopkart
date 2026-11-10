import "server-only"

import { asc, eq, sql } from "drizzle-orm"

import { db } from "../index"
import { products, stockLevels, stockMovements, users } from "../schema"
import { DomainError, isCheckViolation } from "./errors"

export type AdjustStockInput = {
  productId: string
  /** Signed units: +10 to restock, -1 for damage. */
  delta: number
  reason: "restock" | "sale" | "damage" | "return" | "correction" | "reservation_release"
  note?: string
  actorId?: string | null
  /** Optional idempotency key. The same (reference, reason) is only ever applied once. */
  reference?: string
}

/**
 * Records a stock change. Stock is never overwritten: every change is a movement row, and the
 * level is updated in the same transaction. The CHECK constraints in the database reject any
 * change that would make stock negative or drop it below the units reserved for open orders.
 */
export async function adjustStock(input: AdjustStockInput): Promise<{ applied: boolean; onHand: number }> {
  if (!Number.isInteger(input.delta) || input.delta === 0) throw new DomainError("INVALID_QUANTITY", "Enter a whole number other than zero.")
  if ((input.reason === "damage" || input.reason === "correction") && !input.note?.trim()) throw new DomainError("NOTE_REQUIRED", "A note is required for damage and corrections.")
  try {
    return await db.transaction(async (tx) => {
      // Claim the idempotency key first, so a repeated request does nothing.
      const claimed = await tx.insert(stockMovements).values({ productId: input.productId, delta: input.delta, reason: input.reason, note: input.note?.trim() ?? "", actorId: input.actorId ?? null, reference: input.reference ?? null }).onConflictDoNothing().returning({ id: stockMovements.id })
      if (claimed.length === 0) {
        const [level] = await tx.select({ onHand: stockLevels.onHand }).from(stockLevels).where(eq(stockLevels.productId, input.productId))
        return { applied: false, onHand: level?.onHand ?? 0 }
      }
      const updated = await tx.update(stockLevels).set({ onHand: sql`${stockLevels.onHand} + ${input.delta}` }).where(eq(stockLevels.productId, input.productId)).returning({ onHand: stockLevels.onHand })
      if (updated.length === 0) throw new DomainError("NOT_FOUND", "Product not found.")
      return { applied: true, onHand: updated[0].onHand }
    })
  } catch (e) {
    if (isCheckViolation(e)) throw new DomainError("INSUFFICIENT_STOCK", "Stock can't go below zero or below the units reserved for open orders.")
    throw e
  }
}

/** Products at or below their reorder level, lowest first. */
export async function lowStock() {
  return db.select({ productId: products.id, title: products.title, sku: products.sku, onHand: stockLevels.onHand, reserved: stockLevels.reserved, available: sql<number>`${stockLevels.onHand} - ${stockLevels.reserved}`, reorderAt: stockLevels.reorderAt })
    .from(stockLevels).innerJoin(products, eq(products.id, stockLevels.productId))
    .where(sql`${products.status} <> 'archived' and ${stockLevels.onHand} - ${stockLevels.reserved} <= ${stockLevels.reorderAt}`).orderBy(sql`${stockLevels.onHand} - ${stockLevels.reserved}`, asc(products.title))
}

export async function listMovements(productId: string, limit = 50) {
  return db.select({ id: stockMovements.id, delta: stockMovements.delta, reason: stockMovements.reason, note: stockMovements.note, createdAt: stockMovements.createdAt, actor: users.name })
    .from(stockMovements).leftJoin(users, eq(users.id, stockMovements.actorId)).where(eq(stockMovements.productId, productId)).orderBy(sql`${stockMovements.createdAt} desc`).limit(limit)
}
