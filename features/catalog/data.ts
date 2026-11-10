import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import * as q from "@/lib/db/queries"
import type { SearchParams } from "@/lib/db/queries"
import { CACHE_TAGS, productTag } from "@/lib/cache"
import { toProduct } from "./map"
import type { Product, StoreCategory } from "./types"
import type { ShopParams } from "./query"

// The storefront's read side. Every function is cached for a few minutes and tagged, and the APIs that change
// products, stock, reviews or articles expire the tag (lib/cache.ts), so shoppers never wait on a stale page
// and pages never hit the database on every view. Call these from server components only.
// Arguments must be plain values: they become part of the cache key.

const tag = () => { cacheLife("minutes"); cacheTag(CACHE_TAGS.catalog) }
/** Also tag the entry with each product it contains (see invalidateProducts in lib/cache.ts). */
const tagged = <T extends { id: string }>(items: T[]): T[] => { if (items.length) cacheTag(...items.map((p) => productTag(p.id))); return items }

const toSearch = (p: ShopParams): SearchParams => ({
  q: p.q || undefined, category: p.category || undefined, brands: p.brands.length ? p.brands : undefined, minPaise: p.minPaise, maxPaise: p.maxPaise,
  inStock: p.inStock || undefined, rating: p.rating || undefined, discount: p.discount || undefined, sort: p.sort, page: p.page,
})

/** The shop page: filtered, sorted, paginated. */
export async function getShopResults(params: ShopParams, pageSize: number): Promise<{ items: Product[]; total: number; pages: number; page: number }> {
  "use cache"
  tag()
  const r = await q.searchProducts({ ...toSearch(params), pageSize })
  return { items: tagged(r.items.map(toProduct)), total: r.total, pages: r.pages, page: r.page }
}

/** How many products each category and brand would show, given the other filters. */
export async function getShopFacets(params: ShopParams): Promise<{ categories: Record<string, number>; brands: Record<string, number> }> {
  "use cache"
  tag()
  return q.facetCounts(toSearch(params))
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache"
  tag()
  const p = await q.getProductBySlug(slug)
  return p ? tagged([toProduct(p)])[0] : null
}

/** For the product page: the full DTO is not needed, but images and SEO fields are. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  "use cache"
  tag()
  return tagged((await q.getProductsByIds(ids)).map(toProduct))
}

export async function getRelated(productId: string, limit = 5): Promise<Product[]> {
  "use cache"
  tag()
  return tagged((await q.relatedProducts(productId, limit)).map(toProduct))
}

export async function getNewArrivals(limit = 6): Promise<Product[]> {
  "use cache"
  tag()
  return tagged((await q.newArrivals(limit)).map(toProduct))
}

export async function getDeals(limit = 5): Promise<Product[]> {
  "use cache"
  tag()
  return tagged((await q.dealProducts(limit)).map(toProduct))
}

export async function getBestsellers(limit = 6): Promise<Product[]> {
  "use cache"
  tag()
  return tagged((await q.bestsellers(limit)).map(toProduct))
}

/** Most reviewed first: the closest thing to "top selling" before real sales ranking exists. */
export async function getTopSelling(limit = 5): Promise<Product[]> {
  "use cache"
  tag()
  return tagged((await q.searchProducts({ sort: "popular", pageSize: limit })).items.map(toProduct))
}

export async function getCategories(): Promise<StoreCategory[]> {
  "use cache"
  tag()
  return (await q.listCategories()).map((c) => ({ slug: c.slug, name: c.name, short: c.shortName, count: c.count }))
}

export async function getBrands(): Promise<{ name: string; slug: string; count: number }[]> {
  "use cache"
  tag()
  return (await q.listBrands()).map((b) => ({ name: b.name, slug: b.slug, count: b.count }))
}

/** Slugs and last-modified dates for the sitemap. */
export async function getSitemapProducts(): Promise<{ slug: string; updatedAt: string }[]> {
  "use cache"
  tag()
  const r = await q.searchProducts({ pageSize: 48, sort: "newest" })
  return r.items.map((p) => ({ slug: p.slug, updatedAt: p.createdAt.toISOString() }))
}

export async function getDidYouMean(query: string): Promise<string | null> {
  "use cache"
  tag()
  return q.didYouMean(query)
}
