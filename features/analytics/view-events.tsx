"use client"
import { useEffect, useRef } from "react"
import type { Product } from "@/features/catalog/types"
import { useProducts } from "@/features/catalog/use-products"
import { trackViewItem } from "./events"

/** Fires view_item once per product page view. Renders nothing. Pass `product` when you have it; otherwise it is looked up by id. */
export function ViewItemEvent({ productId, product }: { productId: string; product?: Product }) {
  const sent = useRef<string | null>(null)
  const lookup = useProducts(product ? [] : [productId])
  const p = product ?? lookup.products[0]
  useEffect(() => {
    if (!p || sent.current === productId) return
    sent.current = productId
    trackViewItem(p)
  }, [productId, p])
  return null
}
