import "server-only"

import { randomUUID } from "node:crypto"
import { ZodError, type ZodType } from "zod"

import { DomainError, pgCode, pgConstraint } from "@/lib/db/queries/errors"
import { rateLimit, type Limit } from "./rate-limit"
import { getSession, type Session } from "./session"
import { can, type Permission } from "./permissions"

// ---------------------------------------------------------------------------
// One wrapper every route handler goes through, so every endpoint behaves the same:
//   { data } on success, { error: { code, message, details? } } on failure,
//   an X-Request-Id on every response, no stack traces or SQL ever sent to clients.
// ---------------------------------------------------------------------------

const MAX_BODY_BYTES = 256 * 1024

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details?: unknown) { super(message); this.name = "ApiError" }
}

/** Business-rule failures map to HTTP statuses here, in one place. */
const DOMAIN_STATUS: Record<string, number> = {
  NOT_FOUND: 404, PAYMENT_NOT_FOUND: 404,
  INVALID_REVIEW: 422, INVALID_QUANTITY: 422, NOTE_REQUIRED: 422, EMPTY_CART: 422, QUANTITY_LIMIT: 422,
  ALREADY_REVIEWED: 409, OUT_OF_STOCK: 409, INSUFFICIENT_STOCK: 409, PRODUCT_UNAVAILABLE: 409, COUPON_INVALID: 409,
  INVALID_TRANSITION: 409, IN_USE: 409, INVALID_CATEGORY: 422, INVALID_TAX: 422, ORDER_NOT_PAYABLE: 409, AMOUNT_MISMATCH: 409, CONFLICT: 409,
}

/** Which field a unique-index violation belongs to, so forms can show the message beside it. */
const UNIQUE_FIELD: Record<string, { path: string; message: string }> = {
  products_slug_idx: { path: "slug", message: "Another product already uses this URL slug." },
  products_sku_idx: { path: "sku", message: "Another product already uses this SKU." },
  coupons_code_idx: { path: "code", message: "A coupon with this code already exists." },
  articles_slug_idx: { path: "slug", message: "Another article already uses this URL slug." },
  users_email_lower_idx: { path: "email", message: "An account with this email already exists." },
  users_phone_idx: { path: "phone", message: "That mobile number is already linked to an account." },
  brands_name_idx: { path: "brandName", message: "A brand with this name already exists." },
}

export type Ctx<P = Record<string, string>> = {
  req: Request
  params: P
  url: URL
  requestId: string
  session: Session | null
  ip: string | null
  /** Validated JSON body. Throws a 422 with field errors when it does not match. */
  json: <T>(schema: ZodType<T>) => Promise<T>
  /** Validated query string. */
  query: <T>(schema: ZodType<T>) => T
  /** The signed-in user, or throws 401. */
  user: () => Session
  /** Throws 401 when signed out and 403 when the role lacks the permission. */
  require: (permission: Permission) => Session
}

type Options = {
  /** Rate limit for this endpoint. Defaults to 120 requests a minute per client. */
  limit?: Limit
  /** Cache-Control for successful GETs. Defaults to no-store (safe for anything personal). */
  cache?: string
  /** Skip the same-origin check (only for server-to-server calls like webhooks, which carry their own signature). */
  noOriginCheck?: boolean
  /** Read the raw body yourself (webhooks need the exact bytes for signature checks). */
  rawBody?: boolean
}

const parsedHops = Number(process.env.TRUSTED_PROXY_HOPS ?? 1)
if (!Number.isInteger(parsedHops) || parsedHops < 0) throw new Error("TRUSTED_PROXY_HOPS must be a non-negative integer (0 = no proxy in front).")
const TRUSTED_HOPS = parsedHops
const UNATTRIBUTED_FACTOR = 20

/**
 * The client address as seen by OUR proxy, or null when there isn't a trustworthy one.
 * Anyone can send their own X-Forwarded-For, so the left-most entry is attacker-controlled. Each trusted
 * proxy appends the address it received the request from, so we count TRUSTED_PROXY_HOPS entries from the
 * right (1 = a single load balancer in front of the app). Route handlers can't see the socket address, so
 * with 0 hops, or no header, there is no safe per-client key and this returns null. The caller then
 * limits signed-in users per account and puts anonymous requests in one shared bucket with a generous
 * ceiling (UNATTRIBUTED_FACTOR times the endpoint limit): fail closed against floods, without a single
 * noisy caller being able to lock out signed-in customers.
 */
export function clientIp(req: Request, hops = TRUSTED_HOPS): string | null {
  if (hops <= 0) return null
  const chain = (req.headers.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  // Fewer entries than trusted hops means the request did not come through our proxy; X-Real-IP is no
  // fallback because a client can send it too. Treat it as unattributed.
  return chain[chain.length - hops] ?? null
}

export function ok<T>(data: T, init: { status?: number; headers?: HeadersInit } = {}) {
  return Response.json({ data }, { status: init.status ?? 200, headers: init.headers })
}
export const created = <T>(data: T, headers?: HeadersInit) => ok(data, { status: 201, headers })
export const noContent = () => new Response(null, { status: 204 })

function errorResponse(err: unknown, requestId: string): Response {
  const headers = { "x-request-id": requestId, "cache-control": "no-store" }
  const body = (status: number, code: string, message: string, details?: unknown, extra: HeadersInit = {}) =>
    Response.json({ error: { code, message, ...(details ? { details } : {}) }, requestId }, { status, headers: { ...headers, ...extra } })

  if (err instanceof ApiError) return body(err.status, err.code, err.message, err.details, err.status === 429 ? { "retry-after": String((err.details as { retryAfter?: number })?.retryAfter ?? 60) } : {})
  if (err instanceof ZodError) return body(422, "VALIDATION_FAILED", "Some fields are invalid.", err.issues.map((i) => ({ path: i.path.join("."), message: i.message })))
  if (err instanceof DomainError) return body(DOMAIN_STATUS[err.code] ?? 400, err.code, err.message)
  const pg = pgCode(err)
  if (pg === "23505") {
    const hit = UNIQUE_FIELD[pgConstraint(err) ?? ""]
    return body(409, "CONFLICT", hit?.message ?? "That value is already in use.", hit ? [{ path: hit.path, message: hit.message }] : undefined)
  }
  if (pg === "23503" || pg === "23001") return body(409, "IN_USE", "This record is referenced by other data and can't be removed.")
  if (pg === "23514") return body(422, "CONSTRAINT_FAILED", "That value is not allowed.")
  if (pg === "22P02") return body(400, "INVALID_ID", "Malformed identifier.")
  // Unknown failure: log the real error with the request id, tell the client only the id.
  console.error(`[api ${requestId}]`, err)
  return body(500, "INTERNAL", "Something went wrong on our side.")
}

/** State-changing requests that carry the session cookie must come from our own site (CSRF defence in depth on top of SameSite=Lax). */
function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin")
  if (!origin) return // non-browser clients (curl, mobile apps) send no Origin and use no cookies we trust blindly
  const allowed = new Set([new URL(req.url).origin, process.env.APP_ORIGIN].filter(Boolean) as string[])
  if (!allowed.has(origin)) throw new ApiError(403, "BAD_ORIGIN", "Cross-site requests are not allowed.")
}

export function route<P = Record<string, string>>(handler: (ctx: Ctx<P>) => Promise<Response>, opts: Options = {}) {
  return async (req: Request, routeCtx?: { params?: Promise<P> }): Promise<Response> => {
    const requestId = req.headers.get("x-request-id")?.slice(0, 64) || randomUUID()
    try {
      const url = new URL(req.url)
      const ip = clientIp(req)
      const mutating = !["GET", "HEAD", "OPTIONS"].includes(req.method)
      if (mutating && !opts.noOriginCheck) assertSameOrigin(req)

      if (ip) {
        const rl = await rateLimit(`${req.method}:${url.pathname.replace(/[0-9a-f-]{8,}/gi, ":id")}:${ip}`, opts.limit ?? { max: 120, windowSec: 60 })
        if (!rl.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please slow down.", { retryAfter: rl.retryAfter })
      }

      if (mutating && !opts.rawBody) {
        const len = Number(req.headers.get("content-length") ?? 0)
        if (len > MAX_BODY_BYTES) throw new ApiError(413, "BODY_TOO_LARGE", "Request body is too large.")
      }

      const session = await getSession(req)
      const base = opts.limit ?? { max: 120, windowSec: 60 }
      const path = url.pathname.replace(/[0-9a-f-]{8,}/gi, ":id")
      if (session) {
        // Signed-in callers are limited per account, so rotating IP addresses does not reset the limit.
        const ul = await rateLimit(`u:${session.userId}:${req.method}:${path}`, base)
        if (!ul.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please slow down.", { retryAfter: ul.retryAfter })
      } else if (!ip) {
        // Anonymous and unattributable: one shared bucket with a high ceiling instead of no limit at all.
        const al = await rateLimit(`anon:${req.method}:${path}`, { max: base.max * UNATTRIBUTED_FACTOR, windowSec: base.windowSec })
        if (!al.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please slow down.", { retryAfter: al.retryAfter })
      }
      let cached: unknown
      let bodyRead = false
      const ctx: Ctx<P> = {
        req, url, requestId, session, ip, params: (await routeCtx?.params) ?? ({} as P),
        json: async (schema) => {
          if (!opts.rawBody && !(req.headers.get("content-type") ?? "").includes("application/json")) throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Send JSON with Content-Type: application/json.")
          if (!bodyRead) {
            const text = await req.text()
            if (text.length > MAX_BODY_BYTES) throw new ApiError(413, "BODY_TOO_LARGE", "Request body is too large.")
            try { cached = JSON.parse(text) } catch { throw new ApiError(400, "INVALID_JSON", "The request body is not valid JSON.") }
            bodyRead = true
          }
          return schema.parse(cached)
        },
        query: (schema) => schema.parse(Object.fromEntries(url.searchParams)),
        user: () => { if (!session) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in."); return session },
        require: (permission) => {
          if (!session) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in.")
          if (!can(session.role, permission)) throw new ApiError(403, "FORBIDDEN", "You don't have permission to do that.")
          return session
        },
      }

      const res = await handler(ctx)
      const h = new Headers(res.headers)
      h.set("x-request-id", requestId)
      h.set("x-content-type-options", "nosniff")
      if (!h.has("cache-control")) h.set("cache-control", req.method === "GET" && !session ? (opts.cache ?? "no-store") : "no-store")
      return new Response(res.body, { status: res.status, headers: h })
    } catch (err) {
      return errorResponse(err, requestId)
    }
  }
}

/** Common query-string helpers. */
export const intParam = (min: number, max: number, fallback: number) => (v: unknown) => {
  const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : fallback
}
