"use client"
import { useEffect, useState } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { ProductRow } from "@/components/store/product-row"
import { SectionHeader } from "@/components/store/section-header"
import { isUuid } from "./types"
import { useProducts } from "./use-products"

const MAX = 8

type RecentState = {
  /** Product ids, most recently viewed first. */
  ids: string[]
  push: (id: string) => void
}

/** Last products the shopper opened, kept in this browser only. */
export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set) => ({
      ids: [],
      push: (id) => set((s) => (s.ids[0] === id ? s : { ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, MAX) })),
    }),
    { name: "shopkart-recent", storage: createJSONStorage(() => localStorage), skipHydration: true, version: 1, migrate: (state) => ({ ids: (((state ?? {}) as { ids?: string[] }).ids ?? []).filter(isUuid).slice(0, MAX) }) as never },
  ),
)

/** Loads the saved list once, after the first render (the store skips hydration to avoid server/client mismatches). */
function useRecentIds() {
  const ids = useRecentlyViewed((s) => s.ids)
  const [ready, setReady] = useState(false)
  useEffect(() => { void Promise.resolve(useRecentlyViewed.persist.rehydrate()).then(() => setReady(true)) }, [])
  return { ids, ready }
}

/** Render on a product page: remembers that this product was viewed. Renders nothing. */
export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!isUuid(productId)) return
    void Promise.resolve(useRecentlyViewed.persist.rehydrate()).then(() => useRecentlyViewed.getState().push(productId))
  }, [productId])
  return null
}

/** The "Recently Viewed" row. Shown only when the shopper has viewed something that still exists. */
export function RecentlyViewedRow({ exclude }: { exclude?: string }) {
  const { ids, ready } = useRecentIds()
  const wanted = ids.filter((id) => id !== exclude)
  const { products } = useProducts(ready ? wanted : [])
  if (!ready || products.length === 0) return null
  return (
    <section aria-labelledby="recent-heading">
      <SectionHeader id="recent-heading" title="Recently Viewed" />
      <ProductRow products={products} label="Recently viewed products" />
    </section>
  )
}
