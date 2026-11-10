import { sql } from "drizzle-orm"
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { id, timestamps } from "./common"
import { userRole } from "./enums"

/**
 * Better Auth owns sign-in, so `users`, `sessions`, `accounts` and `verifications` follow the shape
 * it expects. `role` and `phone` are our own columns, declared to Better Auth as additional fields
 * (see lib/auth.ts). A password is not on the user: it lives on the credential `accounts` row.
 */
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name").notNull(),
  image: text("image"),
  phone: text("phone"),
  role: userRole("role").notNull().default("customer"),
  ...timestamps,
}, (t) => [
  // Case-insensitive uniqueness: Aarav@x.com and aarav@x.com are the same person.
  uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`),
  uniqueIndex("users_phone_idx").on(t.phone).where(sql`${t.phone} is not null`),
])

export const addresses = pgTable("addresses", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("Home"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  ...timestamps,
}, (t) => [
  index("addresses_user_idx").on(t.userId),
  // At most one default address per customer.
  uniqueIndex("addresses_one_default_idx").on(t.userId).where(sql`${t.isDefault}`),
])

/** Sign-in sessions managed by Better Auth. The browser holds a signed cookie that points at `token`. */
export const sessions = pgTable("sessions", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  ...timestamps,
}, (t) => [uniqueIndex("sessions_token_idx").on(t.token), index("sessions_user_idx").on(t.userId), index("sessions_expiry_idx").on(t.expiresAt)])

/** One row per way a user can sign in: "credential" (email + password) or a social provider such as Google. */
export const accounts = pgTable("accounts", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  /** argon2 hash, only on the credential account. */
  password: text("password"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  ...timestamps,
}, (t) => [index("accounts_user_idx").on(t.userId), uniqueIndex("accounts_provider_idx").on(t.providerId, t.accountId)])

/** Short-lived tokens for email verification and password reset. */
export const verifications = pgTable("verifications", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
}, (t) => [index("verifications_identifier_idx").on(t.identifier)])
