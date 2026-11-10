import { beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { adjustStock, DomainError, lowStock, listMovements } from "../../lib/db/queries"
import { makeCatalog, makeProduct, resetDb, stockOf } from "../helpers"

const movements = (id: string) => db.select().from(s.stockMovements).where(eq(s.stockMovements.productId, id))

describe("inventory", () => {
  let cat: Awaited<ReturnType<typeof makeCatalog>>
  beforeEach(async () => { await resetDb(); cat = await makeCatalog() })

  it("adds stock and records exactly one movement", async () => {
    const p = await makeProduct(cat, { stock: 10 })
    expect(await adjustStock({ productId: p.id, delta: 15, reason: "restock", note: "PO-1" })).toEqual({ applied: true, onHand: 25 })
    expect((await stockOf(p.id)).onHand).toBe(25)
    const rows = await movements(p.id); expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ delta: 15, reason: "restock", note: "PO-1" })
  })

  it("refuses to go below zero or below reserved units, and leaves no trace of the attempt", async () => {
    const p = await makeProduct(cat, { stock: 5, reserved: 3 })
    await expect(adjustStock({ productId: p.id, delta: -3, reason: "sale", reference: "x" })).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" })
    expect(await stockOf(p.id)).toMatchObject({ onHand: 5, reserved: 3 })
    expect(await movements(p.id)).toHaveLength(0) // the failed attempt rolled back, movement included
    expect((await adjustStock({ productId: p.id, delta: -2, reason: "damage", note: "dropped" })).onHand).toBe(3)
  })

  it("is idempotent: the same reference and reason applies once", async () => {
    const p = await makeProduct(cat, { stock: 10 })
    const first = await adjustStock({ productId: p.id, delta: -2, reason: "sale", reference: "SK-1" })
    const again = await adjustStock({ productId: p.id, delta: -2, reason: "sale", reference: "SK-1" })
    expect(first.applied).toBe(true); expect(again.applied).toBe(false)
    expect((await stockOf(p.id)).onHand).toBe(8); expect(await movements(p.id)).toHaveLength(1)
  })

  it("validates input: whole non-zero numbers, and a note for damage or corrections", async () => {
    const p = await makeProduct(cat)
    await expect(adjustStock({ productId: p.id, delta: 0, reason: "restock" })).rejects.toBeInstanceOf(DomainError)
    await expect(adjustStock({ productId: p.id, delta: 1.5, reason: "restock" })).rejects.toMatchObject({ code: "INVALID_QUANTITY" })
    await expect(adjustStock({ productId: p.id, delta: -1, reason: "damage" })).rejects.toMatchObject({ code: "NOTE_REQUIRED" })
    await expect(adjustStock({ productId: "019a0000-0000-7000-8000-000000000000", delta: 1, reason: "restock" })).rejects.toThrow()
  })

  it("reports low stock and lists movement history", async () => {
    const low = await makeProduct(cat, { title: "Low", stock: 3 }); await makeProduct(cat, { title: "Fine", stock: 50 })
    expect((await lowStock()).map((r) => r.title)).toEqual(["Low"])
    await adjustStock({ productId: low.id, delta: 4, reason: "restock" })
    expect((await listMovements(low.id)).map((m) => m.delta)).toEqual([4])
  })
})
