import "server-only"

import { and, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "../index"
import { categories, contactMessages, orderEvents, orderItems, orders, products, returns, reviews, stockLevels, stockMovements, users } from "../schema"
import { loadAdminOrders } from "./admin-views"
import type { AdminOrder } from "@/features/admin/types"
import { can, type Role } from "@/lib/api/permissions"
import { gstFromInclusive } from "@/lib/money"

// Reports are computed from the orders tables, so every figure reconciles with them. Only orders that were
// paid and not later cancelled or refunded count. Like the other admin loaders, no permission check here.
const COUNTED = ["paid", "packed", "shipped", "delivered"] as const

export type SalesDay = { date: string; revenue: number; orders: number }
export type GstRow = { rate: number; taxable: number; gst: number; cgst: number; sgst: number }
export type ProductRow = { title: string; units: number; revenue: number }
/** Sales of one category (or product) on one IST day. Only non-zero rows are sent; the screen adds them up for the chosen range. */
export type CategoryDay = { date: string; label: string; revenue: number; units: number }
export type ProductDay = { date: string; title: string; revenue: number; units: number }
/** Counted orders placed in one IST weekday (0 = Sunday) and hour (0-23) over the last 90 days. */
export type HourBucket = { dow: number; hour: number; n: number }
export type ReportData = {
  series: SalesDay[]; gstRows: GstRow[]; productRows: ProductRow[]; countedOrders: number; countedTotalPaise: number; asOf: string
  categoryDaily: CategoryDay[]; productDaily: ProductDay[]; hourly: HourBucket[]
}

/** For roles that may not see sales data: nothing is queried and nothing is sent to the browser. */
export const EMPTY_REPORT: ReportData = { series: [], gstRows: [], productRows: [], countedOrders: 0, countedTotalPaise: 0, asOf: "", categoryDaily: [], productDaily: [], hourly: [] }

const IST_DAY = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d) // YYYY-MM-DD

export async function loadAdminReports(days = 90): Promise<ReportData> {
  const now = new Date()
  const dates = Array.from({ length: days }, (_, i) => IST_DAY(new Date(now.getTime() - (days - 1 - i) * 86_400_000)))
  const since = new Date(now.getTime() - days * 86_400_000)

  const hourSince = new Date(now.getTime() - 90 * 86_400_000)
  const placedIst = sql`(${orders.placedAt} at time zone 'Asia/Kolkata')`
  const dayExpr = sql<string>`to_char(${placedIst}::date, 'YYYY-MM-DD')`
  const lineValue = sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPricePaise})::int`
  const [daily, lines, totals, catDaily, prodDaily, hours] = await Promise.all([
    db.select({ date: sql<string>`to_char((${orders.placedAt} at time zone 'Asia/Kolkata')::date, 'YYYY-MM-DD')`, revenue: sql<number>`sum(${orders.totalPaise})::int`, n: sql<number>`count(*)::int` })
      .from(orders).where(and(inArray(orders.status, [...COUNTED]), sql`${orders.placedAt} >= ${since}`)).groupBy(sql`1`),
    db.select({ orderId: orders.id, discount: orders.discountPaise, title: orderItems.title, qty: orderItems.quantity, price: orderItems.unitPricePaise, gstPercent: orderItems.gstPercent })
      .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).where(inArray(orders.status, [...COUNTED])),
    db.select({ n: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${orders.totalPaise}), 0)::int` }).from(orders).where(inArray(orders.status, [...COUNTED])),
    db.select({ date: dayExpr, label: categories.name, revenue: lineValue, units: sql<number>`sum(${orderItems.quantity})::int` })
      .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId)).innerJoin(products, eq(products.id, orderItems.productId)).innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(inArray(orders.status, [...COUNTED]), sql`${orders.placedAt} >= ${since}`)).groupBy(sql`1`, categories.name),
    db.select({ date: dayExpr, title: orderItems.title, revenue: lineValue, units: sql<number>`sum(${orderItems.quantity})::int` })
      .from(orderItems).innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(inArray(orders.status, [...COUNTED]), sql`${orders.placedAt} >= ${since}`)).groupBy(sql`1`, orderItems.title),
    db.select({ dow: sql<number>`extract(dow from ${placedIst})::int`, hour: sql<number>`extract(hour from ${placedIst})::int`, n: sql<number>`count(*)::int` })
      .from(orders).where(and(inArray(orders.status, [...COUNTED]), sql`${orders.placedAt} >= ${hourSince}`)).groupBy(sql`1`, sql`2`),
  ])

  const byDate = new Map(daily.map((d) => [d.date, d]))
  const series = dates.map((date) => ({ date, revenue: byDate.get(date)?.revenue ?? 0, orders: byDate.get(date)?.n ?? 0 }))

  // GST is split per line after sharing any order discount across lines in proportion to their value.
  const grossByOrder = new Map<string, number>()
  for (const l of lines) grossByOrder.set(l.orderId, (grossByOrder.get(l.orderId) ?? 0) + l.price * l.qty)
  const gst = new Map<number, { taxable: number; gst: number }>()
  const byProduct = new Map<string, { units: number; revenue: number }>()
  for (const l of lines) {
    const gross = grossByOrder.get(l.orderId) ?? 0
    const lineGross = l.price * l.qty
    const share = gross === 0 ? 0 : Math.round((lineGross / gross) * l.discount)
    const net = lineGross - share, tax = gstFromInclusive(net, l.gstPercent), cur = gst.get(l.gstPercent) ?? { taxable: 0, gst: 0 }
    gst.set(l.gstPercent, { taxable: cur.taxable + net - tax, gst: cur.gst + tax })
    const p = byProduct.get(l.title) ?? { units: 0, revenue: 0 }
    byProduct.set(l.title, { units: p.units + l.qty, revenue: p.revenue + lineGross })
  }
  return {
    series,
    gstRows: [...gst.entries()].sort((a, b) => a[0] - b[0]).map(([rate, v]) => ({ rate, ...v, cgst: Math.floor(v.gst / 2), sgst: v.gst - Math.floor(v.gst / 2) })),
    productRows: [...byProduct.entries()].map(([title, v]) => ({ title, ...v })).sort((a, b) => b.revenue - a.revenue),
    countedOrders: totals[0].n, countedTotalPaise: totals[0].total, asOf: IST_DAY(now),
    categoryDaily: catDaily, productDaily: prodDaily, hourly: hours,
  }
}

// ---------------------------------------------------------------- dashboard
export type DashPerms = { reports: boolean; orders: boolean; inventory: boolean; catalog: boolean; coupons: boolean; returns: boolean; reviews: boolean; inbox: boolean }
export type DashboardExtras = {
  /** Each part is null when the person's role isn't allowed to see it, and is then never queried. */
  statusCounts: { status: string; n: number }[] | null
  pendingPayment: number | null
  /** Paid orders still waiting to be packed. */
  toPack: number | null
  recentOrders: AdminOrder[] | null
  low: { id: string; title: string; left: number }[] | null
  lowCount: number | null
  openReturns: number | null
  newMessages: number | null
  pendingReviews: number | null
  activity: { at: string; text: string; by: string; href: string }[]
}

/** What each dashboard section needs. This is the single place a role is turned into dashboard access. */
export const dashPermsFor = (role: Role): DashPerms => ({
  reports: can(role, "reports:read"), orders: can(role, "orders:read"), inventory: can(role, "inventory:read"), catalog: can(role, "catalog:write"),
  coupons: can(role, "coupons:write"), returns: can(role, "returns:manage"), reviews: can(role, "reviews:moderate"), inbox: can(role, "inbox:manage"),
})

const count = (n: number | undefined) => n ?? 0

/** Dashboard widgets beyond the sales series. The dashboard is open to every staff role, so each widget is permission-scoped here. */
export async function loadAdminDashboard(perms: DashPerms): Promise<DashboardExtras> {
  const lowWhere = and(sql`${products.status} <> 'archived'`, sql`${stockLevels.onHand} - ${stockLevels.reserved} <= ${stockLevels.reorderAt}`)
  const [statusRows, recent, lowRows, lowTotal, openReturns, messages, pendingReviews, events, moves] = await Promise.all([
    perms.orders ? db.select({ status: orders.status, n: sql<number>`count(*)::int` }).from(orders).groupBy(orders.status) : null,
    perms.orders ? loadAdminOrders(8) : null,
    perms.inventory ? db.select({ id: products.id, title: products.title, left: sql<number>`greatest(${stockLevels.onHand} - ${stockLevels.reserved}, 0)` }).from(stockLevels).innerJoin(products, eq(products.id, stockLevels.productId)).where(lowWhere).orderBy(sql`${stockLevels.onHand} - ${stockLevels.reserved}`).limit(5) : null,
    perms.inventory ? db.select({ n: sql<number>`count(*)::int` }).from(stockLevels).innerJoin(products, eq(products.id, stockLevels.productId)).where(lowWhere) : null,
    perms.returns ? db.select({ n: sql<number>`count(*)::int` }).from(returns).where(eq(returns.status, "requested")) : null,
    perms.inbox ? db.select({ n: sql<number>`count(*)::int` }).from(contactMessages).where(eq(contactMessages.status, "new")) : null,
    perms.reviews ? db.select({ n: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.status, "pending")) : null,
    perms.orders ? db.select({ at: orderEvents.createdAt, status: orderEvents.status, note: orderEvents.note, by: orderEvents.actorLabel, number: orders.number }).from(orderEvents).innerJoin(orders, eq(orders.id, orderEvents.orderId)).orderBy(desc(orderEvents.createdAt)).limit(8) : null,
    perms.inventory ? db.select({ at: stockMovements.createdAt, delta: stockMovements.delta, title: products.title, by: users.name }).from(stockMovements).innerJoin(products, eq(products.id, stockMovements.productId)).leftJoin(users, eq(users.id, stockMovements.actorId)).orderBy(desc(stockMovements.createdAt)).limit(8) : null,
  ])
  const activity = [
    ...(events ?? []).map((e) => ({ at: e.at.toISOString(), text: `${e.number} ${e.note ?? e.status}`, by: e.by, href: `/admin/orders/${e.number}` })),
    ...(moves ?? []).map((m) => ({ at: m.at.toISOString(), text: `Stock ${m.delta > 0 ? "+" : ""}${m.delta} · ${m.title}`, by: m.by ?? "System", href: "/admin/inventory" })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)
  const statusN = (s: string) => count(statusRows?.find((r) => r.status === s)?.n)
  return {
    statusCounts: statusRows?.map((r) => ({ status: r.status, n: r.n })) ?? null,
    pendingPayment: statusRows ? statusN("pending") : null, toPack: statusRows ? statusN("paid") : null,
    recentOrders: recent, low: lowRows, lowCount: lowTotal ? lowTotal[0].n : null,
    openReturns: openReturns ? openReturns[0].n : null, newMessages: messages ? messages[0].n : null, pendingReviews: pendingReviews ? pendingReviews[0].n : null,
    activity,
  }
}

/** Everything the dashboard page needs for one role. Sales data is only queried for roles that may read reports. */
export async function loadDashboardData(role: Role) {
  const perms = dashPermsFor(role)
  const [report, extras] = await Promise.all([perms.reports ? loadAdminReports(180) : EMPTY_REPORT, loadAdminDashboard(perms)])
  return { report, extras, perms }
}
