"use client"
import { useState } from "react"
import { Check, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackAddToCart } from "@/features/analytics/events"
import type { Product } from "@/features/catalog/types"
import { useCart } from "./store"

/** `product` is optional and only feeds analytics; without it nothing is tracked. */
export function AddToCartButton({ productId, quantity = 1, disabled, label = "Add to cart", iconOnly = false, className, product }: {
  productId: string; quantity?: number; disabled?: boolean; label?: string; iconOnly?: boolean; className?: string; product?: Product
}) {
  const add = useCart((s) => s.add)
  const [done, setDone] = useState(false)
  return (
    <>
      <Button type="button" disabled={disabled} className={className} onClick={() => {
        add(productId, quantity); if (product) trackAddToCart(product, quantity); setDone(true); window.setTimeout(() => setDone(false), 1800)
      }}>
        {done ? <Check aria-hidden="true" /> : <ShoppingCart aria-hidden="true" />}
        <span className={iconOnly ? "sr-only" : undefined}>{disabled ? "Out of stock" : done ? "Added" : label}</span>
      </Button>
      <span role="status" className="sr-only">{done ? "Added to cart." : ""}</span>
    </>
  )
}
