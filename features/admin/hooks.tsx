"use client"
import { useEffect, useSyncExternalStore } from "react"
import { useArticleStore } from "@/features/articles/store"
import { useReviewStore } from "@/features/reviews/store"
import { useAdmin } from "./store"

/** Loads saved demo data from localStorage after the first render. */
export function AdminHydrator() {
  useEffect(() => { void useAdmin.persist.rehydrate(); void useArticleStore.persist.rehydrate(); void useReviewStore.persist.rehydrate() }, [])
  return null
}

/** False on the server and during hydration, so admin screens never mismatch. */
export function useAdminReady() {
  return useSyncExternalStore((cb) => useAdmin.persist.onFinishHydration(cb), () => useAdmin.persist.hasHydrated(), () => false)
}
