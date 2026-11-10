import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { CACHE_TAGS } from "@/lib/cache"
import { listActiveBannersWithImage } from "@/lib/db/queries"

/** A scheduled hero banner as the storefront draws it. Plain JSON, safe to pass to the client carousel. */
export type HeroBanner = { id: string; title: string; href: string; image: { url: string; alt: string; width: number | null; height: number | null } }

/**
 * Banners for the home hero: placement "Home hero", not paused, inside their start and end dates, with an image.
 * Cached under the `content` tag, which the admin banner API expires on every change. The date check happens when the
 * cache entry is built, so a banner that reaches its start or end time appears or disappears within the cache's
 * freshness window (a few minutes) even without a staff edit.
 */
export async function getHeroBanners(): Promise<HeroBanner[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag(CACHE_TAGS.content)
  return (await listActiveBannersWithImage("home_hero")).map((b) => ({ id: b.id, title: b.title, href: b.href, image: { url: b.imageUrl!, alt: b.imageAlt, width: b.imageWidth, height: b.imageHeight } }))
}
