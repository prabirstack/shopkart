"use client"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { isUuid } from "@/features/catalog/types"
import { MAX_QUANTITY } from "@/lib/store-config"

type CartState = {
  /** productId -> quantity. Only IDs and counts live in the browser, never prices. */
  lines: Record<string, number>
  add: (id: string, quantity?: number) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
  /** Applied coupon code. Only the code is stored; the amount is always recomputed. */
  coupon: string | null
  setCoupon: (code: string | null) => void
}

export { MAX_QUANTITY }

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: {},
      coupon: null,
      setCoupon: (coupon) => set({ coupon }),
      add: (id, quantity = 1) =>
        set((s) => ({ lines: { ...s.lines, [id]: Math.min(MAX_QUANTITY, (s.lines[id] ?? 0) + quantity) } })),
      setQuantity: (id, quantity) =>
        set((s) => {
          const lines = { ...s.lines }
          if (quantity <= 0) delete lines[id]
          else lines[id] = Math.min(MAX_QUANTITY, quantity)
          return { lines }
        }),
      remove: (id) => set((s) => { const lines = { ...s.lines }; delete lines[id]; return { lines } }),
      clear: () => set({ lines: {}, coupon: null }),
    }),
    // skipHydration: server HTML and first client render must match; we rehydrate after mount.
    {
      name: "shopkart-cart", storage: createJSONStorage(() => localStorage), skipHydration: true, version: 2,
      // Version 1 held the old sample catalog's ids ("d1", "t2"...). Real products have uuid ids, so drop anything else.
      migrate: (state) => {
        const s = (state ?? {}) as { lines?: Record<string, number>; coupon?: string | null }
        return { lines: Object.fromEntries(Object.entries(s.lines ?? {}).filter(([id]) => isUuid(id))), coupon: s.coupon ?? null } as never
      },
    },
  ),
)

export const cartCount = (lines: Record<string, number>) =>
  Object.values(lines).reduce((sum, q) => sum + q, 0)
