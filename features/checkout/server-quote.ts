import "server-only"
import { productById } from "@/features/catalog/demo"
import { couponProblem, findCoupon } from "@/features/coupons/demo"
import type { OrderLine } from "@/features/orders/token"
import { quote } from "@/lib/pricing"
import { MAX_QUANTITY } from "@/lib/store-config"

export type OrderQuote = { lines: OrderLine[]; totals: ReturnType<typeof quote>; couponCode: string | null }

/** Authoritative pricing: only product IDs and quantities come from the browser. */
export function buildOrderQuote(items: { id: string; quantity: number }[], couponCode: string | null): OrderQuote | { error: string } {
  if (items.length === 0) return { error: "Your cart is empty." }
  // Merge duplicate IDs first, so two entries for one product cannot dodge the per-product caps.
  const merged = new Map<string, number>()
  for (const { id, quantity } of items) {
    if (!Number.isInteger(quantity) || quantity < 1) return { error: "Invalid quantity in your cart." }
    merged.set(id, (merged.get(id) ?? 0) + quantity)
  }
  const lines: OrderLine[] = []
  for (const [id, quantity] of merged) {
    const product = productById(id)
    if (!product) return { error: "A product in your cart is no longer available." }
    if (quantity > MAX_QUANTITY) return { error: `You can buy at most ${MAX_QUANTITY} of ${product.title}.` }
    if (quantity > product.stock) return { error: `Only ${product.stock} of ${product.title} in stock.` }
    lines.push({ id, title: product.title, pricePaise: product.pricePaise, quantity, gstPercent: product.gstPercent })
  }
  const subtotal = lines.reduce((s, l) => s + l.pricePaise * l.quantity, 0)
  const coupon = couponCode ? findCoupon(couponCode) : undefined
  if (couponCode) {
    const problem = couponProblem(coupon, subtotal)
    if (problem) return { error: problem }
  }
  return { lines, totals: quote(lines, coupon ?? null), couponCode: coupon?.code ?? null }
}
