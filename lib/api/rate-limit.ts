import "server-only"

export type Limit = { max: number; windowSec: number }

// A fixed-window counter held in process memory. It is accurate for a single server and cheap.
// Behind several instances each one counts separately, so for a scaled deployment swap `hit`
// for a shared store (Redis INCR + EXPIRE) without changing any route.
const buckets = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(key: string, limit: Limit, now = Date.now()): Promise<{ allowed: boolean; retryAfter: number }> {
  if (process.env.DISABLE_RATE_LIMIT === "1") return { allowed: true, retryAfter: 0 }
  if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k)
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + limit.windowSec * 1000 }); return { allowed: true, retryAfter: 0 } }
  b.count++
  return b.count > limit.max ? { allowed: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) } : { allowed: true, retryAfter: 0 }
}

export const resetRateLimits = () => buckets.clear()
