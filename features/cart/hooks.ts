"use client"
import { useSyncExternalStore } from "react"
import { useCart } from "./store"

/** False on the server and during hydration, true afterwards, so cart UI never mismatches. */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useCart.persist.onFinishHydration(cb),
    () => useCart.persist.hasHydrated(),
    () => false,
  )
}
