"use client"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { isUuid } from "@/features/catalog/types"

export const MAX_COMPARE = 4

type CompareState = {
  /** Product IDs in the order they were added. Only IDs are stored; everything else is looked up. */
  ids: string[]
  toggle: (id: string) => "added" | "removed" | "full"
  remove: (id: string) => void
  setIds: (ids: string[]) => void
  clear: () => void
}

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const { ids } = get()
        if (ids.includes(id)) { set({ ids: ids.filter((x) => x !== id) }); return "removed" }
        if (ids.length >= MAX_COMPARE) return "full"
        set({ ids: [...ids, id] }); return "added"
      },
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      setIds: (ids) => set({ ids: [...new Set(ids)].slice(0, MAX_COMPARE) }),
      clear: () => set({ ids: [] }),
    }),
    { name: "shopkart-compare", storage: createJSONStorage(() => localStorage), skipHydration: true, version: 2, migrate: (state) => ({ ids: (((state ?? {}) as { ids?: string[] }).ids ?? []).filter(isUuid) }) as never },
  ),
)
