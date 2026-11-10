import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { id } from "./common"
import { users } from "./identity"

/** Store-wide settings as key/value rows, so adding a setting never needs a migration. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
})

/** Who changed what. Never contains secrets or full payment payloads. */
export const auditEvents = pgTable("audit_events", {
  id: id(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("audit_entity_idx").on(t.entity, t.entityId, t.createdAt), index("audit_actor_idx").on(t.actorId, t.createdAt)])
