import "server-only"

import { randomBytes } from "node:crypto"
import { count, desc, eq, sql } from "drizzle-orm"

import { db } from "../index"
import { auditEvents, contactMessages, newsletterSubscribers } from "../schema"
import { DomainError } from "./errors"

// ---------------------------------------------------------------- contact form
export type ContactInput = { name: string; email: string; topic: string; orderNumber?: string; message: string; userId?: string | null }

export async function createContactMessage(input: ContactInput) {
  const [row] = await db.insert(contactMessages).values({ name: input.name, email: input.email.toLowerCase(), topic: input.topic, orderNumber: input.orderNumber ?? null, message: input.message, userId: input.userId ?? null }).returning()
  return row
}

/** A short reference the sender can quote when they follow up, like MSG-4F2A1C. */
export const messageReference = (id: string) => `MSG-${id.replace(/-/g, "").slice(-6).toUpperCase()}`

export type AdminMessage = { id: string; reference: string; name: string; email: string; topic: string; orderNumber: string | null; message: string; status: "new" | "read" | "resolved"; signedIn: boolean; createdAt: string; handledAt: string | null }

export async function loadAdminMessages(limit = 300): Promise<AdminMessage[]> {
  const rows = await db.select().from(contactMessages).orderBy(sql`case ${contactMessages.status} when 'new' then 0 when 'read' then 1 else 2 end`, desc(contactMessages.createdAt)).limit(limit)
  return rows.map((m) => ({ id: m.id, reference: messageReference(m.id), name: m.name, email: m.email, topic: m.topic, orderNumber: m.orderNumber, message: m.message, status: m.status, signedIn: m.userId !== null, createdAt: m.createdAt.toISOString(), handledAt: m.handledAt?.toISOString() ?? null }))
}

export async function setContactStatus(id: string, status: "new" | "read" | "resolved", actorId: string | null) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(contactMessages).where(eq(contactMessages.id, id)).for("update")
    if (!before) throw new DomainError("NOT_FOUND", "Message not found.")
    if (before.status === status) return { changed: false }
    await tx.update(contactMessages).set({ status, handledBy: status === "new" ? null : actorId, handledAt: status === "new" ? null : new Date() }).where(eq(contactMessages.id, id))
    await tx.insert(auditEvents).values({ actorId, action: "inbox.message_status", entity: "contact_message", entityId: id, before: { status: before.status }, after: { status } })
    return { changed: true }
  })
}

// ---------------------------------------------------------------- newsletter
const newToken = () => randomBytes(24).toString("base64url")

/**
 * Signs an address up. Always succeeds from the caller's point of view and never reveals whether the address was
 * already on the list, so the form can't be used to find out who subscribes. Someone who had unsubscribed and signs
 * up again on purpose is subscribed again, with a fresh unsubscribe token.
 */
export async function subscribeNewsletter(email: string, source: string): Promise<void> {
  const address = email.trim().toLowerCase()
  const rows = await db.insert(newsletterSubscribers).values({ email: address, unsubscribeToken: newToken(), source }).onConflictDoNothing().returning({ id: newsletterSubscribers.id })
  if (rows.length > 0) return
  await db.update(newsletterSubscribers).set({ status: "subscribed", unsubscribedAt: null, unsubscribeToken: newToken() }).where(sql`lower(${newsletterSubscribers.email}) = ${address} and ${newsletterSubscribers.status} = 'unsubscribed'`)
}

/** The one-click unsubscribe. Returns false for an unknown token. Safe to repeat. */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const [row] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.unsubscribeToken, token)).limit(1)
  if (!row) return false
  if (row.status === "subscribed") await db.update(newsletterSubscribers).set({ status: "unsubscribed", unsubscribedAt: new Date() }).where(eq(newsletterSubscribers.id, row.id))
  return true
}

export type AdminSubscriber = { id: string; email: string; status: "subscribed" | "unsubscribed"; source: string; createdAt: string; unsubscribedAt: string | null }

export async function loadAdminSubscribers(limit = 1000): Promise<{ items: AdminSubscriber[]; subscribed: number; total: number }> {
  const [rows, [c]] = await Promise.all([
    db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(limit),
    db.select({ total: count(), subscribed: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'subscribed')::int` }).from(newsletterSubscribers),
  ])
  return { items: rows.map((r) => ({ id: r.id, email: r.email, status: r.status, source: r.source, createdAt: r.createdAt.toISOString(), unsubscribedAt: r.unsubscribedAt?.toISOString() ?? null })), subscribed: c.subscribed, total: c.total }
}

/** Removes a subscriber for good (a privacy request). */
export async function deleteSubscriber(id: string, actorId: string | null) {
  const rows = await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id)).returning({ id: newsletterSubscribers.id })
  if (rows.length === 0) throw new DomainError("NOT_FOUND", "Subscriber not found.")
  await db.insert(auditEvents).values({ actorId, action: "inbox.subscriber_delete", entity: "newsletter_subscriber", entityId: id, before: null, after: null })
}
