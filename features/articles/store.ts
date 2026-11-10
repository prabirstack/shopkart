"use client"
import { useSyncExternalStore } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { seedArticles } from "./seed"
import type { Article } from "./types"

type ArticleState = {
  articles: Article[]
  upsert: (a: Article) => void
  remove: (id: string) => void
  setStatus: (id: string, status: Article["status"]) => void
  reset: () => void
}

/**
 * Articles shared by the storefront and the admin editor. Starts from the seed articles; edits
 * made in the admin are saved in this browser, so what you publish shows on the store here.
 */
export const useArticleStore = create<ArticleState>()(
  persist(
    (set) => ({
      articles: seedArticles,
      upsert: (a) => set((s) => ({ articles: s.articles.some((x) => x.id === a.id) ? s.articles.map((x) => (x.id === a.id ? a : x)) : [a, ...s.articles] })),
      remove: (id) => set((s) => ({ articles: s.articles.filter((a) => a.id !== id) })),
      setStatus: (id, status) => set((s) => ({ articles: s.articles.map((a) => (a.id === id ? { ...a, status, updatedAt: "2026-11-10" } : a)) })),
      reset: () => set({ articles: seedArticles }),
    }),
    { name: "shopkart-articles", storage: createJSONStorage(() => localStorage), skipHydration: true, version: 1 },
  ),
)

export const useArticlesReady = () =>
  useSyncExternalStore((cb) => useArticleStore.persist.onFinishHydration(cb), () => useArticleStore.persist.hasHydrated(), () => false)

/** Published articles. Before the saved data loads, the server-rendered seed list is shown. */
export function usePublishedArticles(initial: Article[]): Article[] {
  const ready = useArticlesReady()
  const all = useArticleStore((s) => s.articles)
  return ready ? all.filter((a) => a.status === "published").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) : initial
}
