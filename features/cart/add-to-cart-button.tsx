"use client"
import { useState } from "react"
import { Check, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "./store"

export function AddToCartButton({ productId, quantity = 1, disabled, label = "Add to cart", iconOnly = false, className }: {
  productId: string; quantity?: number; disabled?: boolean; label?: string; iconOnly?: boolean; className?: string
}) {
  const add = useCart((s) => s.add)
  const [done, setDone] = useState(false)
  return (
    <>
      <Button type="button" disabled={disabled} className={className} onClick={() => {
        add(productId, quantity); setDone(true); window.setTimeout(() => setDone(false), 1800)
      }}>
        {done ? <Check aria-hidden="true" /> : <ShoppingCart aria-hidden="true" />}
        <span className={iconOnly ? "sr-only" : undefined}>{disabled ? "Out of stock" : done ? "Added" : label}</span>
      </Button>
      <span role="status" className="sr-only">{done ? "Added to cart." : ""}</span>
    </>
  )
}
