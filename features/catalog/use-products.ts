"use client"
import { useEffect, useMemo, useState } from "react"
import type { Product } from "./types"

// The cart, wishlist and compare list keep only product ids in the browser. This turns ids into current
// products (price, availability, details) from the API, with a small in-memory cache shared by every component.
const cache = new Map<string, { product: Product | null; at: number }>()
const TTL = 60_000
const inflight = new Map<string, Promise<void>>()

async function load(ids: string[]) {
  const need = ids.filter((id) => { const c = cache.get(id); return !c || Date.now() - c.at > TTL })
  if (need.length === 0) return
  const key = need.slice().sort().join(",")
  if (!inflight.has(key)) {
    inflight.set(key, (async () => {
      try {
        const res = await fetch(`/api/v1/products/by-ids?ids=${encodeURIComponent(need.join(","))}`)
        const list: Product[] = res.ok ? ((await res.json()).data ?? []) : []
        const byId = new Map(list.map((p) => [p.id, p]))
        const at = Date.now()
        for (const id of need) cache.set(id, { product: byId.get(id) ?? null, at })
      } finally { inflight.delete(key) }
    })())
  }
  await inflight.get(key)
}

/** Forget what we know about these products (for example after the cart changes stock). */
export const forgetProducts = (ids?: string[]) => { if (!ids) cache.clear(); else ids.forEach((i) => cache.delete(i)) }

/**
 * Products for a list of ids, in the same order. `loading` is true until the first answer arrives; ids that no
 * longer exist (deleted or archived) come back in `missing` so callers can drop them from the list.
 */
export function useProducts(ids: string[]) {
  const key = ids.join(",")
  const [, bump] = useState(0)
  const [done, setDone] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    const wanted = key ? key.split(",") : []
    if (wanted.length === 0) return
    void load(wanted.slice(0, 50)).then(() => { if (live) { setDone(key); bump((n) => n + 1) } })
    return () => { live = false }
  }, [key])
  return useMemo(() => {
    const wanted = key ? key.split(",") : []
    const entries = wanted.map((id) => ({ id, entry: cache.get(id) }))
    const products = entries.flatMap((e) => (e.entry?.product ? [e.entry.product] : []))
    const missing = entries.filter((e) => e.entry && e.entry.product === null).map((e) => e.id)
    return { products, missing, loading: wanted.length > 0 && done !== key && entries.some((e) => !e.entry) }
  }, [key, done])
}
