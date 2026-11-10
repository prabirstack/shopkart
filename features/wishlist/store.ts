"use client"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

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
    { name: "shopkart-wishlist", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
)
