"use client"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

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

export const MAX_QUANTITY = 10

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
    { name: "shopkart-cart", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
)

export const cartCount = (lines: Record<string, number>) =>
  Object.values(lines).reduce((sum, q) => sum + q, 0)
