import "server-only"

import { and, asc, eq, lte, gte } from "drizzle-orm"

import { db } from "../index"
import { banners } from "../schema"

/** Banners that are live right now for a placement: inside their dates and not paused. */
export async function listActiveBanners(slot: (typeof banners.$inferSelect)["slot"], now = new Date()) {
  return db.select().from(banners).where(and(eq(banners.slot, slot), eq(banners.isPaused, false), lte(banners.startsAt, now), gte(banners.endsAt, now))).orderBy(asc(banners.startsAt))
}

/** Live banners for a placement that have artwork: the only ones the storefront can draw. Oldest start first, so the order is stable. */
export async function listActiveBannersWithImage(slot: (typeof banners.$inferSelect)["slot"], now = new Date()) {
  return (await listActiveBanners(slot, now)).filter((b) => b.imageUrl)
}
