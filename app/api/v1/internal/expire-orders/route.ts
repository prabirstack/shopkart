import { timingSafeEqual } from "node:crypto"

import { ApiError, ok, route } from "@/lib/api/http"
import { expireStalePendingOrders } from "@/lib/db/queries"

/**
 * Called by a scheduler (cron, Vercel Cron, a worker) every few minutes: cancels unpaid orders older than
 * ORDER_HOLD_MINUTES (default 30) and returns their stock and coupon use. Protected by a shared secret in the
 * Authorization header. With no CRON_SECRET configured the endpoint does not exist.
 */
export const POST = route(async ({ req }) => {
  const secret = process.env.CRON_SECRET
  if (!secret) throw new ApiError(404, "NOT_FOUND", "Not found.")
  const given = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "")
  const want = Buffer.from(secret)
  if (given.length !== want.length || !timingSafeEqual(given, want)) throw new ApiError(401, "UNAUTHENTICATED", "Invalid credentials.")
  const minutes = Math.min(Math.max(Number(process.env.ORDER_HOLD_MINUTES ?? 30) || 30, 5), 1440)
  return ok({ expired: await expireStalePendingOrders(minutes) })
}, { noOriginCheck: true, limit: { max: 12, windowSec: 60 }, invalidates: ["catalog"] })
