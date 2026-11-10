"use client"
import { useEffect, useSyncExternalStore } from "react"
import { useProducts } from "@/features/catalog/use-products"
import { useCompare } from "./store"

/** False on the server and during hydration, so compare UI never mismatches. */
export function useCompareHydrated() {
  return useSyncExternalStore((cb) => useCompare.persist.onFinishHydration(cb), () => useCompare.persist.hasHydrated(), () => false)
}

/**
 * The products in the compare list, loaded from the API. Products that no longer exist (deleted or archived) are
 * dropped from the saved list, so the list never holds ids that can't be shown.
 */
export function useCompareProducts() {
  const hydrated = useCompareHydrated()
  const ids = useCompare((s) => s.ids)
  const setIds = useCompare((s) => s.setIds)
  const { products, missing, loading } = useProducts(hydrated ? ids : [])
  useEffect(() => {
    if (missing.length > 0) setIds(useCompare.getState().ids.filter((id) => !missing.includes(id)))
  }, [missing, setIds])
  return { hydrated, ids, products, loading }
}
