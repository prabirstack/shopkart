"use client"
import { useSyncExternalStore } from "react"
import { useWishlist } from "./store"

export function WishlistCount() {
  const ids = useWishlist((s) => s.ids)
  const hydrated = useSyncExternalStore(
    (cb) => useWishlist.persist.onFinishHydration(cb),
    () => useWishlist.persist.hasHydrated(),
    () => false,
  )
  const count = hydrated ? ids.length : 0
  if (count === 0) return null
  return (
    <span aria-label={`${count} saved items`}
      className="absolute -top-1 right-0 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  )
}
