import { sql } from "drizzle-orm"
import { customType, integer, timestamp, uuid } from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Conventions used by every table
// - Money is stored as integer paise (₹499.00 -> 49900). Never floats.
// - Primary keys are time-ordered UUIDs from Postgres 18's native uuidv7(),
//   so new rows land at the end of the index and inserts stay fast.
// - Timestamps are timezone-aware.
// - Rules that must always hold (no negative stock, prices above zero, one
//   captured payment per order) are CHECK / UNIQUE constraints in the database,
//   not only application code, so no code path can break them.
// ---------------------------------------------------------------------------

export const id = () => uuid("id").primaryKey().default(sql`uuidv7()`)

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}

/** An integer column holding paise. */
export const paise = (name: string) => integer(name)

/** Postgres full-text search vector, filled by a generated column. */
export const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" })
