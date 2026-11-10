"use client"
import { useMemo } from "react"
import { couponProblem, findCoupon } from "@/features/coupons/demo"
import { productById, type Product } from "@/features/catalog/demo"
import { quote } from "@/lib/pricing"
import { useHydrated } from "./hooks"
import { useCart } from "./store"

export type CartLine = { product: Product; quantity: number }

/** Joins cart IDs with public product data and computes a display quote. */
export function useCartSummary() {
  const lines = useCart((s) => s.lines)
  const couponCode = useCart((s) => s.coupon)
  const hydrated = useHydrated()
  return useMemo(() => {
    const items: CartLine[] = hydrated
      ? Object.entries(lines).flatMap(([id, quantity]) => { const product = productById(id); return product ? [{ product, quantity }] : [] })
      : []
    const subtotal = items.reduce((s, l) => s + l.product.pricePaise * l.quantity, 0)
    const coupon = couponCode ? findCoupon(couponCode) : undefined
    const problem = couponCode ? couponProblem(coupon, subtotal) : null
    const q = quote(items.map((l) => ({ pricePaise: l.product.pricePaise, quantity: l.quantity, gstPercent: l.product.gstPercent })), problem === null && coupon ? coupon : null)
    return { hydrated, items, quote: q, coupon: problem === null ? coupon ?? null : null, couponCode, couponProblem: problem, count: items.reduce((s, l) => s + l.quantity, 0) }
  }, [lines, couponCode, hydrated])
}
