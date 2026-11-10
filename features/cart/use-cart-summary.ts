"use client"
import { useEffect, useMemo, useState } from "react"
import { validateCoupon, type CouponCheck } from "@/features/coupons/validate"
import type { Product } from "@/features/catalog/types"
import { useProducts } from "@/features/catalog/use-products"
import { quote, type Quote } from "@/lib/pricing"
import { MAX_QUANTITY } from "@/lib/store-config"
import { useHydrated } from "./hooks"
import { useCart } from "./store"

export type CartLine = { product: Product; quantity: number }

/** Most a shopper can buy of a product right now. */
export const maxFor = (p: Pick<Product, "stock">) => Math.min(MAX_QUANTITY, p.stock)

/**
 * Joins the cart (ids and counts only) with current product data from the API and computes a display quote.
 * Products that no longer exist are dropped from the cart and quantities above stock are lowered, each with a
 * notice. Lines with no stock left stay visible (so the shopper can remove them) but are left out of the totals.
 * The server recomputes everything when the order is placed.
 */
export function useCartSummary() {
  const lines = useCart((s) => s.lines)
  const couponCode = useCart((s) => s.coupon)
  const hydrated = useHydrated()
  const ids = useMemo(() => (hydrated ? Object.keys(lines) : []), [hydrated, lines])
  const { products, missing, loading } = useProducts(ids)
  const [notices, setNotices] = useState<string[]>([])

  const items = useMemo<CartLine[]>(() => products.flatMap((product) => (lines[product.id] ? [{ product, quantity: lines[product.id] }] : [])), [products, lines])
  const buyable = useMemo(() => items.filter((l) => l.product.stock > 0), [items])
  const soldOut = items.length - buyable.length

  // Notices are raised from an effect that edits the cart (an external store); queued so state is not set mid-effect.
  const notify = (message: string) => queueMicrotask(() => setNotices((n) => [...n, message]))
  useEffect(() => {
    const { lines: current, remove, setQuantity } = useCart.getState()
    const gone = missing.filter((id) => id in current)
    if (gone.length > 0) {
      gone.forEach(remove)
      notify(gone.length === 1 ? "An item in your cart is no longer available and was removed." : `${gone.length} items in your cart are no longer available and were removed.`)
    }
    for (const { product, quantity } of items) {
      const cap = maxFor(product)
      if (cap > 0 && quantity > cap) {
        setQuantity(product.id, cap)
        notify(`Only ${cap} of ${product.title} ${cap === 1 ? "is" : "are"} available, so we lowered your quantity.`)
      }
    }
  }, [missing, items])

  const request = useMemo(() => buyable.map((l) => ({ productId: l.product.id, quantity: l.quantity })), [buyable])
  const requestKey = couponCode ? `${couponCode}|${request.map((r) => `${r.productId}:${r.quantity}`).join(",")}` : ""
  const [checked, setChecked] = useState<{ key: string; result: CouponCheck } | null>(null)
  useEffect(() => {
    if (!requestKey || request.length === 0 || !couponCode) return
    let live = true
    const t = window.setTimeout(() => { void validateCoupon(couponCode, request).then((result) => { if (live) setChecked({ key: requestKey, result }) }) }, 250)
    return () => { live = false; window.clearTimeout(t) }
  }, [requestKey, request, couponCode])

  const result = checked && checked.key === requestKey ? checked.result : null
  const checking = Boolean(requestKey) && request.length > 0 && result === null
  const base = useMemo(() => quote(buyable.map((l) => ({ pricePaise: l.product.pricePaise, quantity: l.quantity, gstPercent: l.product.gstPercent })), null), [buyable])
  const applied = result?.valid ? result : null
  const totals: Quote = applied ? applied.totals : base

  return {
    hydrated, loading: !hydrated || loading, items, buyable, soldOut, quote: totals, notices, dismissNotices: () => setNotices([]),
    coupon: applied ? { code: applied.code } : null, couponCode, checking,
    couponProblem: result && !result.valid ? result.reason : null,
    count: buyable.reduce((s, l) => s + l.quantity, 0),
  }
}
