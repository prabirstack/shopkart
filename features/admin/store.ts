"use client"
import { useArticleStore } from "@/features/articles/store"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { initialBanners, initialCoupons, initialMovements, initialOrders, initialProducts, initialReturns, initialSettings } from "./seed"
import type { AdminBanner, AdminCoupon, AdminOrder, AdminProduct, AdminReturn, OrderStatus, ProductStatus, ReturnStatus, Settings, StockMovement, StockReason } from "./types"

type AdminState = {
  products: AdminProduct[]; orders: AdminOrder[]; movements: StockMovement[]; coupons: AdminCoupon[]
  banners: AdminBanner[]; returns: AdminReturn[]; settings: Settings
  upsertProduct: (p: AdminProduct) => void
  setProductStatus: (ids: string[], status: ProductStatus) => void
  deleteProducts: (ids: string[]) => void
  adjustStock: (productId: string, delta: number, reason: StockReason, note: string) => string | null
  setOrderStatus: (id: string, status: OrderStatus, note?: string) => void
  addOrderNote: (id: string, note: string) => void
  upsertCoupon: (c: AdminCoupon) => void
  toggleCoupon: (id: string) => void
  deleteCoupon: (id: string) => void
  upsertBanner: (b: AdminBanner) => void
  deleteBanner: (id: string) => void
  setReturnStatus: (id: string, status: ReturnStatus) => void
  saveSettings: (s: Settings) => void
  resetDemo: () => void
}

const now = () => new Date().toISOString()
const seed = () => ({ products: initialProducts, orders: initialOrders, movements: initialMovements, coupons: initialCoupons, banners: initialBanners, returns: initialReturns, settings: initialSettings })

/**
 * Demo back-office data, kept in the browser so every admin action really works and survives a refresh.
 * A real store reads and writes PostgreSQL through permission-checked services; the screens stay the same.
 */
export const useAdmin = create<AdminState>()(
  persist(
    (set, get) => ({
      ...seed(),
      upsertProduct: (p) => set((s) => ({ products: s.products.some((x) => x.id === p.id) ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] })),
      setProductStatus: (ids, status) => set((s) => ({ products: s.products.map((p) => (ids.includes(p.id) ? { ...p, status } : p)) })),
      deleteProducts: (ids) => set((s) => ({ products: s.products.filter((p) => !ids.includes(p.id)) })),
      adjustStock: (productId, delta, reason, note) => {
        const p = get().products.find((x) => x.id === productId)
        if (!p) return "Product not found."
        if (!Number.isInteger(delta) || delta === 0) return "Enter a whole number other than zero."
        if (p.stock + delta < p.reserved) return `Stock can't go below the ${p.reserved} units reserved for open orders.`
        if ((reason === "damage" || reason === "correction") && note.trim() === "") return "A note is required for damage and corrections."
        const movement: StockMovement = { id: `m${Date.now()}`, productId, delta, reason, note: note.trim(), at: now(), by: "You" }
        set((s) => ({ products: s.products.map((x) => (x.id === productId ? { ...x, stock: x.stock + delta } : x)), movements: [movement, ...s.movements] }))
        return null
      },
      setOrderStatus: (id, status, note) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status, timeline: [...o.timeline, { status, at: now(), by: "You", note }] } : o)) })),
      addOrderNote: (id, note) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, notes: [note, ...o.notes] } : o)) })),
      upsertCoupon: (c) => set((s) => ({ coupons: s.coupons.some((x) => x.id === c.id) ? s.coupons.map((x) => (x.id === c.id ? c : x)) : [c, ...s.coupons] })),
      toggleCoupon: (id) => set((s) => ({ coupons: s.coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) })),
      deleteCoupon: (id) => set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) })),
      upsertBanner: (b) => set((s) => ({ banners: s.banners.some((x) => x.id === b.id) ? s.banners.map((x) => (x.id === b.id ? b : x)) : [b, ...s.banners] })),
      deleteBanner: (id) => set((s) => ({ banners: s.banners.filter((b) => b.id !== id) })),
      setReturnStatus: (id, status) => set((s) => ({ returns: s.returns.map((r) => (r.id === id ? { ...r, status } : r)) })),
      saveSettings: (settings) => set({ settings }),
      resetDemo: () => { useArticleStore.getState().reset(); set(seed()) },
    }),
    { name: "shopkart-admin-demo", storage: createJSONStorage(() => localStorage), skipHydration: true, version: 2, migrate: (state) => { const { articles: _legacy, ...rest } = state as Record<string, unknown>; void _legacy; return rest as never } },
  ),
)

export const orderTotal = (o: AdminOrder) => o.lines.reduce((t, l) => t + l.pricePaise * l.quantity, 0) - o.discountPaise + o.shippingPaise
