"use client"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { isUuid } from "@/features/catalog/types"

type WishlistState = {
  /** Product IDs in the order they were saved. */
  ids: string[]
  toggle: (id: string) => void
  remove: (id: string) => void
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids] })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
    }),
    { name: "shopkart-wishlist", storage: createJSONStorage(() => localStorage), skipHydration: true, version: 2, migrate: (state) => ({ ids: (((state ?? {}) as { ids?: string[] }).ids ?? []).filter(isUuid) }) as never },
  ),
)
