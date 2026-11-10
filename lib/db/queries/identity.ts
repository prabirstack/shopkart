import "server-only"

import { and, asc, eq, sql } from "drizzle-orm"

import { db } from "../index"
import { addresses, products, users, wishlistItems } from "../schema"
import { DomainError, isUniqueViolation } from "./errors"

const publicUser = (u: typeof users.$inferSelect) => ({ id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role, emailVerified: u.emailVerified, createdAt: u.createdAt })

// Registration, sign-in, sessions and password changes are handled by Better Auth (lib/auth.ts).

export async function getProfile(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return u ? publicUser(u) : null
}

export async function updateProfile(userId: string, patch: { name?: string; phone?: string | null }) {
  try {
    const [u] = await db.update(users).set({ ...(patch.name !== undefined ? { name: patch.name.trim() } : {}), ...(patch.phone !== undefined ? { phone: patch.phone || null } : {}) }).where(eq(users.id, userId)).returning()
    return publicUser(u)
  } catch (e) {
    if (isUniqueViolation(e)) throw new DomainError("CONFLICT", "That phone number is already in use.")
    throw e
  }
}

// ---- Addresses (always scoped to the owner in the query itself) ----
export type AddressInput = { label: string; name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; pincode: string; isDefault?: boolean }

export const listAddresses = (userId: string) => db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(sql`${addresses.isDefault} desc`, asc(addresses.createdAt))

export async function saveAddress(userId: string, input: AddressInput, id?: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ n: sql<number>`count(*)::int` }).from(addresses).where(eq(addresses.userId, userId))
    if (!id && existing.n >= 10) throw new DomainError("LIMIT_REACHED", "You can save up to 10 addresses.")
    const makeDefault = input.isDefault || (!id && existing.n === 0)
    if (makeDefault) await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId))
    const values = { ...input, line2: input.line2 ?? null, isDefault: !!makeDefault }
    if (id) {
      const [row] = await tx.update(addresses).set(values).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).returning()
      if (!row) throw new DomainError("NOT_FOUND", "Address not found.")
      return row
    }
    const [row] = await tx.insert(addresses).values({ ...values, userId }).returning()
    return row
  })
}

export async function deleteAddress(userId: string, id: string) {
  const rows = await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId))).returning({ id: addresses.id })
  if (rows.length === 0) throw new DomainError("NOT_FOUND", "Address not found.")
}

// ---- Wishlist ----
export async function listWishlist(userId: string): Promise<string[]> {
  return (await db.select({ id: wishlistItems.productId }).from(wishlistItems).innerJoin(products, eq(products.id, wishlistItems.productId)).where(and(eq(wishlistItems.userId, userId), eq(products.status, "published"))).orderBy(sql`${wishlistItems.createdAt} desc`)).map((r) => r.id)
}
export async function addToWishlist(userId: string, productId: string) {
  await db.insert(wishlistItems).values({ userId, productId }).onConflictDoNothing()
}
export async function removeFromWishlist(userId: string, productId: string) {
  await db.delete(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
}
