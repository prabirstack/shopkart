"use client"
import { useSyncExternalStore } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type ReviewStatus = "pending" | "approved" | "rejected"
export type UserReview = {
  id: string; productId: string; name: string; rating: number; title: string; body: string
  date: string; status: ReviewStatus; verified: boolean
}
export type NewReview = Omit<UserReview, "id" | "date" | "status">

type ReviewState = {
  reviews: UserReview[]
  /** Review IDs this browser has marked helpful, and the extra vote counts they add. */
  voted: string[]
  helpful: Record<string, number>
  submit: (r: NewReview, id: string, date: string) => string | null
  setStatus: (id: string, status: ReviewStatus) => void
  remove: (id: string) => void
  vote: (id: string) => void
  reset: () => void
}

/**
 * Shopper reviews waiting for moderation or approved. Demo storage lives in this browser; a real
 * store keeps them in the database, ties each one to a verified purchase, and allows one per buyer.
 */
export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],
      voted: [],
      helpful: {},
      submit: (r, id, date) => {
        if (get().reviews.some((x) => x.productId === r.productId && x.status !== "rejected")) return "You have already reviewed this product."
        set((s) => ({ reviews: [{ ...r, id, date, status: "pending" }, ...s.reviews] }))
        return null
      },
      setStatus: (id, status) => set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, status } : r)) })),
      remove: (id) => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
      vote: (id) => set((s) => (s.voted.includes(id) ? s : { voted: [...s.voted, id], helpful: { ...s.helpful, [id]: (s.helpful[id] ?? 0) + 1 } })),
      reset: () => set({ reviews: [], voted: [], helpful: {} }),
    }),
    { name: "shopkart-user-reviews", storage: createJSONStorage(() => localStorage), skipHydration: true, version: 1 },
  ),
)

export const useReviewsReady = () =>
  useSyncExternalStore((cb) => useReviewStore.persist.onFinishHydration(cb), () => useReviewStore.persist.hasHydrated(), () => false)
