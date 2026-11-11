// A deterministic 90-day order history for the demo, so the admin charts have something to show.
// Same inputs always give the same orders (a small seeded random generator, no Math.random or clock reads beyond `now`).
import type { OrderStatus } from "../../features/admin/types"

export type HistoryProduct = { id: string; pricePaise: number; gstPercent: number; title: string }
export type HistoryOrder = {
  number: string; customerIndex: number; placedAt: Date; status: OrderStatus
  lines: { productId: string; quantity: number }[]; method: string
}

function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const IST_MS = 330 * 60_000
// Relative busyness by IST hour: quiet nights, a lunchtime bump, a strong evening.
const HOUR_WEIGHT = [1, 1, 0, 0, 0, 1, 2, 3, 5, 6, 6, 7, 8, 7, 6, 6, 7, 8, 10, 12, 13, 11, 6, 3]
// Sunday .. Saturday: weekends sell more.
const DOW_WEIGHT = [1.35, 0.85, 0.8, 0.85, 0.9, 1.1, 1.45]
const METHODS = ["UPI", "UPI", "UPI", "Card", "Card", "Netbanking", "Wallet"]

function pick<T>(rand: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rand() * total
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i] }
  return items[items.length - 1]
}

export function generateHistory(now: Date, products: HistoryProduct[], customerCount: number, days = 90): HistoryOrder[] {
  const rand = mulberry32(20261110)
  // The first few products are the best sellers; the long tail sells rarely.
  const productWeights = products.map((_, i) => 1 / (1 + i * 0.35))
  const hours = HOUR_WEIGHT.map((_, h) => h)
  const out: HistoryOrder[] = []
  let n = 0
  for (let ago = days - 1; ago >= 0; ago--) {
    const day = new Date(now.getTime() - ago * 86_400_000)
    const dow = new Date(day.getTime() + IST_MS).getUTCDay()
    const growth = 0.75 + 0.5 * ((days - ago) / days) // the store is slowly growing
    const base = 2.1 * DOW_WEIGHT[dow] * growth
    const count = Math.max(0, Math.round(base + (rand() - 0.5) * 2.6))
    for (let k = 0; k < count; k++) {
      const hour = pick(rand, hours, HOUR_WEIGHT)
      const istMidnight = Math.floor((day.getTime() + IST_MS) / 86_400_000) * 86_400_000 - IST_MS
      const placedAt = new Date(istMidnight + hour * 3_600_000 + Math.floor(rand() * 3_600_000))
      if (placedAt.getTime() > now.getTime() - 3_600_000) continue
      const lineCount = pick(rand, [1, 2, 3], [6, 3, 1])
      const used = new Set<string>()
      const lines: HistoryOrder["lines"] = []
      for (let l = 0; l < lineCount; l++) {
        const p = pick(rand, products, productWeights)
        if (used.has(p.id)) continue
        used.add(p.id)
        lines.push({ productId: p.id, quantity: p.pricePaise > 500000 ? 1 : pick(rand, [1, 2, 3], [7, 2, 1]) })
      }
      const age = ago
      const roll = rand()
      const status: OrderStatus = age <= 1 ? pick(rand, ["pending", "paid", "packed"], [3, 4, 2])
        : age <= 5 ? pick(rand, ["paid", "packed", "shipped", "delivered", "cancelled"], [2, 2, 4, 3, 1])
        : roll < 0.8 ? "delivered" : roll < 0.89 ? "cancelled" : roll < 0.95 ? "refunded" : "shipped"
      out.push({ number: `SK-${9000 + n++}`, customerIndex: Math.floor(rand() * customerCount), placedAt, status, lines, method: METHODS[Math.floor(rand() * METHODS.length)] })
    }
  }
  return out
}
