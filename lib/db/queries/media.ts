import "server-only"

import { inArray } from "drizzle-orm"

import { db } from "../index"
import { banners, productImages } from "../schema"
import { DomainError } from "./errors"
import { keyFromUrl, type MediaKind } from "@/lib/media"
import { getStorage } from "@/lib/storage"

/** Rejects image URLs whose file isn't in storage, so a forged (or expired) key can't be attached to a product or banner. */
export async function assertMediaExists(urls: (string | null | undefined)[], kind: MediaKind) {
  const storage = getStorage()
  for (const url of new Set(urls)) {
    const key = url ? keyFromUrl(url, kind) : null
    if (key && !(await storage.exists(key))) throw new DomainError("INVALID_IMAGE", "One of the photos is no longer available. Remove it and upload it again.")
  }
}

/**
 * Deletes stored files that nothing references any more. Call it AFTER the database change has committed: the rows
 * are the source of truth, so a failure here only leaves an unused file behind (logged, never thrown).
 * Demo files (public/images) and URLs that aren't ours are left alone.
 */
export async function deleteUnreferencedMedia(urls: (string | null | undefined)[]) {
  try {
    const candidates = [...new Set(urls.filter((u): u is string => !!u))].filter((u) => keyFromUrl(u) !== null)
    if (candidates.length === 0) return
    const [pi, bn] = await Promise.all([
      db.select({ url: productImages.url }).from(productImages).where(inArray(productImages.url, candidates)),
      db.select({ url: banners.imageUrl }).from(banners).where(inArray(banners.imageUrl, candidates)),
    ])
    const used = new Set([...pi.map((r) => r.url), ...bn.map((r) => r.url)])
    const storage = getStorage()
    for (const url of candidates) {
      if (used.has(url)) continue
      try { await storage.delete(keyFromUrl(url)!) } catch (e) { console.error(`[media] could not delete ${url}:`, e) }
    }
  } catch (e) {
    console.error("[media] orphan clean-up failed:", e)
  }
}
