import "server-only"

import { and, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "../index"
import { categories, orderEvents, orderItems, orders, products, stockLevels, stockMovements, users } from "../schema"
import { loadAdminOrders } from "./admin-views"
import type { AdminOrder } from "@/features/admin/types"
import { gstFromInclusive } from "@/lib/money"

// Reports are computed from the orders tables, so every figure reconciles with them. Only orders that were
// paid and not later cancelled or refunded count. Like the other admin loaders, no permission check here.
const COUNTED = ["paid", "packed", "shipped", "delivered"] as const

export type SalesDay = { date: string; revenue: number; orders: number }
export type GstRow = { rate: number; taxable: number; gst: number; cgst: number; sgst: number }
export type ProductRow = { title: string; units: number; revenue: number }
export type ReportData = { series: SalesDay[]; gstRows: GstRow[]; productRows: ProductRow[]; countedOrders: number; countedTotalPaise: number; asOf: string }

/** For roles that may not see sales data: nothing is queried and nothing is sent to the browser. */
export const EMPTY_REPORT: ReportData = { series: [], gstRows: [], productRows: [], countedOrders: 0, countedTotalPaise: 0, asOf: "" }

const IST_DAY = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d) // YYYY-MM-DD

export async function loadAdminReports(days = 90): Promise<ReportData> {
  const now = new Date()
  const dates = Array.from({ length: days }, (_, i) => IST_DAY(new Date(now.getTime() - (days - 1 - i) * 86_400_000)))
  const since = new Date(now.getTime() - days * 86_400_000)

  const [daily, lines, totals] = await Promise.all([
    db.select({ date: sql<string>`to_char((${orders.placedAt} at time zone 'Asia/Kolkata')::date, 'YYYY-MM-DD')`, revenue: sql<number>`sum(${orders.totalPaise})::int`, n: sql<number>`count(*)::int` })
      .from(orders).where(and(inArray(orders.status, [...COUNTED]), sql`${orders.placedAt} >= ${since}`)).groupBy(sql`1`),
    db.select({ orderId: orders.id, discount: orders.discountPaise, title: orderItems.title, qty: orderItems.quantity, price: orderItems.unitPricePaise, gstPercent: orderItems.gstPercent })
      .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).where(inArray(orders.status, [...COUNTED])),
    db.select({ n: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${orders.totalPaise}), 0)::int` }).from(orders).where(inArray(orders.status, [...COUNTED])),
  ])

  const byDate = new Map(daily.map((d) => [d.date, d]))
  const series = dates.map((date) => ({ date, revenue: byDate.get(date)?.revenue ?? 0, orders: byDate.get(date)?.n ?? 0 }))

  // GST is split per line after sharing any order discount across lines in proportion to their value.
  const grossByOrder = new Map<string, number>()
  for (const l of lines) grossByOrder.set(l.orderId, (grossByOrder.get(l.orderId) ?? 0) + l.price * l.qty)
  const gst = new Map<number, { taxable: number; gst: number }>()
  const products = new Map<string, { units: number; revenue: number }>()
  for (const l of lines) {
    const gross = grossByOrder.get(l.orderId) ?? 0
    const lineGross = l.price * l.qty
    const share = gross === 0 ? 0 : Math.round((lineGross / gross) * l.discount)
    const net = lineGross - share, tax = gstFromInclusive(net, l.gstPercent), cur = gst.get(l.gstPercent) ?? { taxable: 0, gst: 0 }
    gst.set(l.gstPercent, { taxable: cur.taxable + net - tax, gst: cur.gst + tax })
    const p = products.get(l.title) ?? { units: 0, revenue: 0 }
    products.set(l.title, { units: p.units + l.qty, revenue: p.revenue + lineGross })
  }
  return {
    series,
    gstRows: [...gst.entries()].sort((a, b) => a[0] - b[0]).map(([rate, v]) => ({ rate, ...v, cgst: Math.floor(v.gst / 2), sgst: v.gst - Math.floor(v.gst / 2) })),
    productRows: [...products.entries()].map(([title, v]) => ({ title, ...v })).sort((a, b) => b.revenue - a.revenue),
    countedOrders: totals[0].n, countedTotalPaise: totals[0].total, asOf: IST_DAY(now),
  }
}

// ---------------------------------------------------------------- dashboard
export type DashPerms = { reports: boolean; orders: boolean; inventory: boolean; catalog: boolean; coupons: boolean }
export type DashboardExtras = {
  /** Each part is null when the person's role isn't allowed to see it, and is then never queried. */
  statusCounts: { status: string; n: number }[] | null
  pendingPayment: number | null
  recentOrders: AdminOrder[] | null
  topCategories: { label: string; value: number }[] | null
  low: { id: string; title: string; left: number }[] | null
  activity: { at: string; text: string; by: string; href: string }[]
}

/** Dashboard widgets beyond the sales series. The dashboard is open to every staff role, so each widget is permission-scoped here. */
export async function loadAdminDashboard(perms: DashPerms): Promise<DashboardExtras> {
  const [statusRows, pending, recent, cats, lowRows, events, moves] = await Promise.all([
    perms.orders ? db.select({ status: orders.status, n: sql<number>`count(*)::int` }).from(orders).groupBy(orders.status) : null,
    perms.orders ? db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "pending")) : null,
    perms.orders ? loadAdminOrders(8) : null,
    perms.reports ? db.select({ label: categories.name, value: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPricePaise})::int` }).from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).innerJoin(products, eq(products.id, orderItems.productId)).innerJoin(categories, eq(categories.id, products.categoryId)).where(inArray(orders.status, [...COUNTED])).groupBy(categories.name).orderBy(sql`2 desc`).limit(5) : null,
    perms.inventory ? db.select({ id: products.id, title: products.title, left: sql<number>`greatest(${stockLevels.onHand} - ${stockLevels.reserved}, 0)` }).from(stockLevels).innerJoin(products, eq(products.id, stockLevels.productId)).where(and(sql`${products.status} <> 'archived'`, sql`${stockLevels.onHand} - ${stockLevels.reserved} <= ${stockLevels.reorderAt}`)).orderBy(sql`${stockLevels.onHand} - ${stockLevels.reserved}`).limit(4) : null,
    perms.orders ? db.select({ at: orderEvents.createdAt, status: orderEvents.status, note: orderEvents.note, by: orderEvents.actorLabel, number: orders.number }).from(orderEvents).innerJoin(orders, eq(orders.id, orderEvents.orderId)).orderBy(desc(orderEvents.createdAt)).limit(8) : null,
    perms.inventory ? db.select({ at: stockMovements.createdAt, delta: stockMovements.delta, title: products.title, by: users.name }).from(stockMovements).innerJoin(products, eq(products.id, stockMovements.productId)).leftJoin(users, eq(users.id, stockMovements.actorId)).orderBy(desc(stockMovements.createdAt)).limit(8) : null,
  ])
  const activity = [
    ...(events ?? []).map((e) => ({ at: e.at.toISOString(), text: `${e.number} ${e.note ?? e.status}`, by: e.by, href: `/admin/orders/${e.number}` })),
    ...(moves ?? []).map((m) => ({ at: m.at.toISOString(), text: `Stock ${m.delta > 0 ? "+" : ""}${m.delta} · ${m.title}`, by: m.by ?? "System", href: "/admin/inventory" })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)
  return {
    statusCounts: statusRows?.map((r) => ({ status: r.status, n: r.n })) ?? null, pendingPayment: pending?.[0].n ?? null, recentOrders: recent, topCategories: cats, low: lowRows, activity,
  }
}
