"use client"
import { useSyncExternalStore } from "react"
import { useCompare } from "./store"

/** False on the server and during hydration, so compare UI never mismatches. */
export function useCompareHydrated() {
  return useSyncExternalStore((cb) => useCompare.persist.onFinishHydration(cb), () => useCompare.persist.hasHydrated(), () => false)
}
