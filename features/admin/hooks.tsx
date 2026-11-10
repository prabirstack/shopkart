"use client"
import { useEffect, useSyncExternalStore } from "react"
import { useAdmin } from "./store"

/** Loads saved demo data from localStorage after the first render. */
export function AdminHydrator() {
  useEffect(() => { void useAdmin.persist.rehydrate() }, [])
  return null
}

/** False on the server and during hydration, so admin screens never mismatch. */
export function useAdminReady() {
  return useSyncExternalStore((cb) => useAdmin.persist.onFinishHydration(cb), () => useAdmin.persist.hasHydrated(), () => false)
}
