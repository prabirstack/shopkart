import "server-only"

import { revalidateTag } from "next/cache"

// Storefront reads are cached (see features/catalog/data.ts) and tagged. Anything that changes what shoppers
// can see calls one of these so the next request gets fresh data instead of waiting for the cache to expire.
export const CACHE_TAGS = { catalog: "catalog", content: "content" } as const
export type CacheTag = keyof typeof CACHE_TAGS

/** Expire cached storefront data now. Safe outside the Next.js runtime (tests), where there is nothing cached. */
export function invalidate(...tags: CacheTag[]) {
  for (const t of tags) {
    try { revalidateTag(CACHE_TAGS[t], { expire: 0 }) } catch (e) {
      // Outside Next.js (unit tests) there is nothing cached, so this is expected there. Anywhere else it means a
      // cache was NOT expired and shoppers could see stale data, so say so loudly.
      if (process.env.VITEST === undefined) console.error(`[cache] could not expire "${t}":`, e)
    }
  }
}
