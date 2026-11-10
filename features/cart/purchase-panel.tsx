"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Minus, Plus, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddToCartButton } from "./add-to-cart-button"
import { MAX_QUANTITY, useCart } from "./store"

export function PurchasePanel({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter()
  const add = useCart((s) => s.add)
  const max = Math.min(MAX_QUANTITY, stock)
  const [qty, setQty] = useState(1)
  if (stock === 0) {
    return <AddToCartButton productId={productId} disabled className="h-11 w-full" />
  }
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <span id="qty-label" className="text-sm font-medium">Quantity</span>
        <div role="group" aria-labelledby="qty-label" className="flex items-center rounded-lg border">
          <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} className="grid size-9 place-items-center disabled:opacity-40"><Minus className="size-4" aria-hidden="true" /></button>
          <span aria-live="polite" className="price w-8 text-center text-sm font-medium">{qty}</span>
          <button type="button" aria-label="Increase quantity" disabled={qty >= max} onClick={() => setQty((q) => q + 1)} className="grid size-9 place-items-center disabled:opacity-40"><Plus className="size-4" aria-hidden="true" /></button>
        </div>
        {qty >= max && <span className="text-xs text-muted-foreground">Maximum quantity</span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <AddToCartButton productId={productId} quantity={qty} className="h-11" />
        <Button type="button" variant="outline" className="h-11 border-primary text-primary hover:bg-primary/5"
          onClick={() => { add(productId, qty); router.push("/checkout") }}>
          <Zap aria-hidden="true" /> Buy now
        </Button>
      </div>
    </div>
  )
}
