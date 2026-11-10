"use client"
import { cartCount, useCart } from "./store"
import { useHydrated } from "./hooks"

export function CartCount() {
  const lines = useCart((s) => s.lines)
  const hydrated = useHydrated()
  const count = hydrated ? cartCount(lines) : 0
  return (
    <span aria-label={`${count} items in cart`}
      className="absolute -top-1 right-0 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  )
}
