import "server-only"

import { asc, desc, sql } from "drizzle-orm"

import { db } from "../index"
import { orders, products, taxCategories } from "../schema"
import type { OrderStatus } from "@/features/admin/types"

// More loaders for the admin screens. Like admin-views.ts, they do NO permission checks:
// only call them from inside <Authorized>.

export type AdminCustomerStats = {
  orderCount: number
  spentPaise: number
  lastPlaced: string | null
  /** Newest first. */
  orders: { number: string; status: OrderStatus; totalPaise: number; placed: string }[]
}

/** Per-customer order numbers, keyed by user id. Orders that are pending or cancelled don't count. */
export async function loadAdminCustomerStats(): Promise<Record<string, AdminCustomerStats>> {
  const rows = await db.select({ userId: orders.userId, number: orders.number, status: orders.status, totalPaise: orders.totalPaise, placed: orders.placedAt })
    .from(orders).orderBy(desc(orders.placedAt), asc(orders.id))
  const out: Record<string, AdminCustomerStats> = {}
  for (const r of rows) {
    if (!r.userId) continue
    const s = (out[r.userId] ??= { orderCount: 0, spentPaise: 0, lastPlaced: null, orders: [] })
    s.orders.push({ number: r.number, status: r.status, totalPaise: r.totalPaise, placed: r.placed.toISOString() })
    if (r.status === "pending" || r.status === "cancelled") continue
    s.orderCount += 1
    s.lastPlaced ??= r.placed.toISOString()
    if (r.status === "paid" || r.status === "packed" || r.status === "shipped" || r.status === "delivered") s.spentPaise += r.totalPaise
  }
  return out
}

export type AdminTaxCategory = { id: string; name: string; hsn: string; ratePercent: number; products: number }

export async function loadAdminTaxCategories(): Promise<AdminTaxCategory[]> {
  const rows = await db.select({ id: taxCategories.id, name: taxCategories.name, hsn: taxCategories.hsn, ratePercent: taxCategories.ratePercent, products: sql<number>`(select count(*)::int from ${products} p where p.tax_category_id = ${taxCategories.id})` })
    .from(taxCategories).orderBy(asc(taxCategories.ratePercent), asc(taxCategories.name))
  return rows.map((r) => ({ id: r.id, name: r.name, hsn: r.hsn ?? "—", ratePercent: r.ratePercent, products: Number(r.products) }))
}
