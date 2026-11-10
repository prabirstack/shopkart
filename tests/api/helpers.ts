import { eq } from "drizzle-orm"

import { auth } from "../../lib/auth"
import { db } from "../../lib/db"
import { users } from "../../lib/db/schema"

export const ORIGIN = "http://localhost:3000"
export type Role = "customer" | "owner" | "catalog_editor" | "warehouse" | "support" | "finance"

let n = 0

/** Signs a real user up through Better Auth and returns their session cookie header. */
export async function signUp(role: Role = "customer", email = `api${Date.now()}${++n}@example.com`) {
  const res = await auth.api.signUpEmail({ body: { email, password: "correct-horse-battery", name: "Test Person" }, returnHeaders: true })
  if (role !== "customer") await db.update(users).set({ role }).where(eq(users.id, res.response.user.id))
  const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ")
  return { cookie, userId: res.response.user.id, email }
}

type Init = { method?: string; body?: unknown; cookie?: string; headers?: Record<string, string>; origin?: string | null }

export function req(path: string, init: Init = {}) {
  const headers: Record<string, string> = { ...init.headers }
  if (init.cookie) headers.cookie = init.cookie
  if (init.body !== undefined) headers["content-type"] = "application/json"
  if (init.origin !== null && init.method && init.method !== "GET") headers.origin = init.origin ?? ORIGIN
  return new Request(`${ORIGIN}${path}`, { method: init.method ?? "GET", headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) })
}

export const ctx = <P extends Record<string, string>>(params: P) => ({ params: Promise.resolve(params) })
export const json = async (res: Response) => ({ status: res.status, body: (await res.json().catch(() => null)) as any, headers: res.headers })
