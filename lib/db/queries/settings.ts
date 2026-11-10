import "server-only"

import { sql } from "drizzle-orm"

import { db } from "../index"
import { settings } from "../schema"

/** All settings as one object. Values are whatever was stored under each key. */
export async function getSettings(): Promise<Record<string, unknown>> {
  const rows = await db.select().from(settings)
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function saveSettings(values: Record<string, unknown>, actorId: string | null = null) {
  const rows = Object.entries(values).map(([key, value]) => ({ key, value, updatedBy: actorId }))
  if (rows.length === 0) return
  await db.insert(settings).values(rows).onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value`, updatedBy: sql`excluded.updated_by`, updatedAt: sql`now()` } })
}
