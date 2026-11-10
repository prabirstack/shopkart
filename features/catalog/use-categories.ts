"use client"
import { useEffect, useState } from "react"

export type CategoryLink = { slug: string; name: string; short: string }

let cached: CategoryLink[] | null = null

/** Category names and slugs for small client-side lists (empty states). Loaded once from the public API. */
export function useCategories(): CategoryLink[] {
  const [list, setList] = useState<CategoryLink[]>(cached ?? [])
  useEffect(() => {
    if (cached) return
    let live = true
    void fetch("/api/v1/categories").then((r) => (r.ok ? r.json() : null)).then((b: { data?: { slug: string; name: string; shortName: string; count: number }[] } | null) => {
      if (!b?.data) return
      cached = b.data.filter((c) => c.count > 0).map((c) => ({ slug: c.slug, name: c.name, short: c.shortName }))
      if (live) setList(cached)
    }).catch(() => undefined)
    return () => { live = false }
  }, [])
  return list
}
