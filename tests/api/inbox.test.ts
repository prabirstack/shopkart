import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import { POST as contact } from "../../app/api/v1/contact/route"
import { POST as subscribe } from "../../app/api/v1/newsletter/route"
import { POST as unsubscribe } from "../../app/api/v1/newsletter/unsubscribe/route"
import { PATCH as setStatus } from "../../app/api/v1/admin/inbox/messages/[id]/route"
import { DELETE as removeSubscriber } from "../../app/api/v1/admin/inbox/subscribers/[id]/route"
import { resetRateLimits } from "../../lib/api/rate-limit"
import { loadAdminMessages } from "../../lib/db/queries"
import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { resetDb } from "../helpers"
import { ctx, json, req, signUp } from "./helpers"

const valid = { name: "Riya Sharma", email: "Riya@Example.com", topic: "Order status", orderNumber: "sk-10482", message: "Where is my order? It was due yesterday." }
const send = (body: object, extra: Parameters<typeof req>[1] = {}) => contact(req("/api/v1/contact", { method: "POST", body, ...extra }))
const sub = (body: object, extra: Parameters<typeof req>[1] = {}) => subscribe(req("/api/v1/newsletter", { method: "POST", body, ...extra }))

describe("contact form", () => {
  beforeEach(resetDb)

  it("stores a message and gives the sender a reference", async () => {
    const r = await json(await send(valid))
    expect(r.status).toBe(201); expect(r.body.data.reference).toMatch(/^MSG-[0-9A-F]{6}$/)
    const [m] = await db.select().from(s.contactMessages)
    expect(m).toMatchObject({ name: "Riya Sharma", email: "riya@example.com", topic: "Order status", orderNumber: "SK-10482", status: "new", userId: null })
  })

  it("validates every field and says which one is wrong", async () => {
    const r = await json(await send({ name: "R", email: "not-an-email", topic: "Spam", orderNumber: "12345", message: "short" }))
    expect(r.status).toBe(422)
    expect(r.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual(["email", "message", "name", "orderNumber", "topic"])
    expect(await db.select().from(s.contactMessages)).toHaveLength(0)
  })

  it("treats an empty order number as none, and links a signed-in sender to their account", async () => {
    const u = await signUp()
    expect((await json(await send({ ...valid, orderNumber: "" }, { cookie: u.cookie }))).status).toBe(201)
    expect(await db.select().from(s.contactMessages)).toMatchObject([{ orderNumber: null, userId: u.userId }])
  })

  it("acknowledges but silently drops a message that filled the hidden honeypot field", async () => {
    const r = await json(await send({ ...valid, website: "http://spam.example" }))
    expect(r.status).toBe(201) // bots learn nothing
    expect(await db.select().from(s.contactMessages)).toHaveLength(0)
  })

  describe("rate limiting", () => {
    beforeEach(() => { resetRateLimits(); process.env.DISABLE_RATE_LIMIT = "0" })
    afterEach(() => { process.env.DISABLE_RATE_LIMIT = "1"; resetRateLimits() })
    it("allows a few messages per client, then asks them to wait", async () => {
      const from = { headers: { "x-forwarded-for": "203.0.113.9" } }
      for (let i = 0; i < 5; i++) expect((await json(await send(valid, from))).status).toBe(201)
      const blocked = await json(await send(valid, from))
      expect(blocked.status).toBe(429); expect(blocked.headers.get("retry-after")).toBeTruthy()
      expect((await json(await send(valid, { headers: { "x-forwarded-for": "198.51.100.7" } }))).status).toBe(201) // another client is unaffected
    })
  })
})

describe("newsletter", () => {
  beforeEach(resetDb)
  const rows = () => db.select().from(s.newsletterSubscribers)

  it("subscribes an address (stored lowercase) and answers identically when it is already subscribed", async () => {
    const first = await json(await sub({ email: "Fan@Example.com" })), again = await json(await sub({ email: "fan@example.com" }))
    expect(first.status).toBe(200); expect(again.status).toBe(200); expect(again.body).toMatchObject({ data: { subscribed: true } }); expect(Object.keys(again.body.data)).toEqual(Object.keys(first.body.data))
    expect(await rows()).toMatchObject([{ email: "fan@example.com", status: "subscribed", source: "footer" }])
  })

  it("rejects a bad address and ignores honeypot submissions", async () => {
    expect((await json(await sub({ email: "nope" }))).status).toBe(422)
    expect((await json(await sub({ email: "bot@example.com", website: "x" }))).status).toBe(200)
    expect(await rows()).toHaveLength(0)
  })

  it("unsubscribes with the token from the link, safely repeatable, and rejects unknown tokens", async () => {
    await sub({ email: "leaver@example.com" }); const [row] = await rows()
    const go = (token: string) => unsubscribe(req("/api/v1/newsletter/unsubscribe", { method: "POST", body: { token } }))
    expect((await json(await go("x".repeat(30)))).status).toBe(404)
    expect((await json(await go(row.unsubscribeToken))).body.data).toEqual({ unsubscribed: true })
    expect((await json(await go(row.unsubscribeToken))).status).toBe(200) // repeating is harmless
    expect((await rows())[0]).toMatchObject({ status: "unsubscribed" }); expect((await rows())[0].unsubscribedAt).toBeInstanceOf(Date)
  })

  it("lets someone who left sign up again on purpose, with a fresh token", async () => {
    await sub({ email: "back@example.com" }); const [before] = await rows()
    await unsubscribe(req("/api/v1/newsletter/unsubscribe", { method: "POST", body: { token: before.unsubscribeToken } }))
    await sub({ email: "back@example.com" })
    const all = await rows(); expect(all).toHaveLength(1)
    expect(all[0].status).toBe("subscribed"); expect(all[0].unsubscribeToken).not.toBe(before.unsubscribeToken); expect(all[0].unsubscribedAt).toBeNull()
  })
})

describe("admin inbox", () => {
  beforeEach(resetDb)

  it("lists new messages first and lets support resolve one, recording who and when", async () => {
    await send(valid); await send({ ...valid, message: "A second question about my refund please." })
    const [first, second] = await db.select().from(s.contactMessages).orderBy(s.contactMessages.createdAt)
    await db.update(s.contactMessages).set({ status: "resolved" }).where(eq(s.contactMessages.id, first.id))
    expect((await loadAdminMessages()).map((m) => m.id)).toEqual([second.id, first.id])
    const support = await signUp("support")
    const call = (id: string, status: string, cookie = support.cookie) => setStatus(req(`/api/v1/admin/inbox/messages/${id}`, { method: "PATCH", cookie, body: { status } }), ctx({ id }))
    expect((await json(await call(second.id, "resolved"))).body.data).toEqual({ changed: true })
    expect((await json(await call(second.id, "resolved"))).body.data).toEqual({ changed: false })
    const [after] = await db.select().from(s.contactMessages).where(eq(s.contactMessages.id, second.id))
    expect(after).toMatchObject({ status: "resolved", handledBy: support.userId }); expect(after.handledAt).toBeInstanceOf(Date)
    expect((await db.select().from(s.auditEvents)).filter((e) => e.action === "inbox.message_status")).toHaveLength(1)
  })

  it("is closed to roles without the inbox permission, and to customers and visitors", async () => {
    await send(valid); const [m] = await db.select().from(s.contactMessages)
    for (const [who, expected] of [["warehouse", 403], ["catalog_editor", 403], ["customer", 403]] as const) {
      const u = await signUp(who)
      expect((await json(await setStatus(req(`/api/v1/admin/inbox/messages/${m.id}`, { method: "PATCH", cookie: u.cookie, body: { status: "read" } }), ctx({ id: m.id })))).status, who).toBe(expected)
    }
    expect((await json(await setStatus(req(`/api/v1/admin/inbox/messages/${m.id}`, { method: "PATCH", body: { status: "read" } }), ctx({ id: m.id })))).status).toBe(401)
  })

  it("lets support remove a subscriber (a privacy request) and audits it", async () => {
    await sub({ email: "gone@example.com" }); const [row] = await db.select().from(s.newsletterSubscribers)
    const support = await signUp("support"), warehouse = await signUp("warehouse")
    const del = (cookie: string) => removeSubscriber(req(`/api/v1/admin/inbox/subscribers/${row.id}`, { method: "DELETE", cookie }), ctx({ id: row.id }))
    expect((await del(warehouse.cookie)).status).toBe(403)
    expect((await del(support.cookie)).status).toBe(204)
    expect(await db.select().from(s.newsletterSubscribers)).toHaveLength(0)
    expect((await db.select().from(s.auditEvents)).some((e) => e.action === "inbox.subscriber_delete")).toBe(true)
  })
})
