// Sample analytics for the demo dashboard. Real numbers come from paid orders in the database
// (see the analytics chapter): a dashboard figure must always reconcile with the orders table.

export const TODAY = "2026-11-10"

export type DayPoint = { date: string; revenue: number; orders: number; visitors: number }

/** Small seeded generator so the same data renders on server and client. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const addDays = (iso: string, delta: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + delta); return d.toISOString().slice(0, 10) }

/** Ninety days ending today, with weekend lift and a gentle upward trend. */
export const dailySeries: DayPoint[] = (() => {
  const rand = mulberry32(2026)
  return Array.from({ length: 90 }, (_, i) => {
    const date = addDays(TODAY, i - 89)
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
    const weekend = dow === 0 || dow === 6 ? 1.25 : 1
    const trend = 1 + i / 160
    const orders = Math.round((16 + rand() * 12) * weekend * trend)
    const aov = 210000 + Math.round(rand() * 120000)
    return { date, orders, revenue: orders * aov, visitors: Math.round(orders * (28 + rand() * 14)) }
  })
})()

export type Range = 7 | 30 | 90
export const rangeSlice = (days: Range) => dailySeries.slice(-days)
export const previousSlice = (days: Range) => dailySeries.slice(-days * 2, -days)

export const sum = (pts: DayPoint[], k: keyof Omit<DayPoint, "date">) => pts.reduce((s, p) => s + p[k], 0)
/** Percentage change from previous to current. */
export const delta = (current: number, previous: number) => (previous === 0 ? 0 : ((current - previous) / previous) * 100)

export const topCategories = [
  { label: "Electronics", value: 8420000 }, { label: "Mobiles & Tablets", value: 6150000 }, { label: "Kitchen & Dining", value: 2890000 },
  { label: "Fashion", value: 1740000 }, { label: "Home & Living", value: 960000 },
]

export const trafficSources = [
  { label: "Organic search", value: 41 }, { label: "Direct", value: 24 }, { label: "Social", value: 18 }, { label: "Email", value: 11 }, { label: "Referral", value: 6 },
]

export const formatShortDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${iso}T00:00:00Z`))
