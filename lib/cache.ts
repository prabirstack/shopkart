import "server-only"

import { revalidateTag } from "next/cache"

// Storefront reads are cached (see features/catalog/data.ts) and tagged. Anything that changes what shoppers
// can see calls one of these so the next request gets fresh data instead of waiting for the cache to expire.
export const CACHE_TAGS = { catalog: "catalog", content: "content" } as const
export type CacheTag = keyof typeof CACHE_TAGS

/** Cached storefront data that includes a product is also tagged with the product, so one product can be refreshed alone. */
export const productTag = (id: string) => `product:${id}`

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

/**
 * Expire cached storefront data for specific products only. Customer actions (placing, paying or cancelling an
 * order) change the stock of a handful of products, so they must NOT flush the whole catalog: a shopper could
 * otherwise trigger that over and over and force every page back to the database. Staff edits use the global tags.
 */
export function invalidateProducts(ids: string[]) {
  for (const id of [...new Set(ids)].slice(0, 50)) {
    try { revalidateTag(productTag(id), { expire: 0 }) } catch (e) { if (process.env.VITEST === undefined) console.error(`[cache] could not expire product ${id}:`, e) }
  }
}
