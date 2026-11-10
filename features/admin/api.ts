"use client"

/** A failed API call, with the server's message (safe to show) and any per-field problems. */
export class ApiFailure extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly fields: { path: string; message: string }[] = []) { super(message); this.name = "ApiFailure" }
}

/**
 * Calls the permission-checked /api/v1 endpoints from admin screens. The browser sends the session cookie and
 * the Origin header automatically; the server checks both, and checks the role again on every call.
 */
export async function adminApi<T = unknown>(path: string, opts: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api/v1/${path}`, { method: opts.method ?? "GET", headers: opts.body === undefined ? undefined : { "content-type": "application/json" }, body: opts.body === undefined ? undefined : JSON.stringify(opts.body), credentials: "same-origin" })
  } catch {
    throw new ApiFailure(0, "NETWORK", "Couldn't reach the server. Check your connection and try again.")
  }
  if (res.status === 204) return undefined as T
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const e = json?.error
    if (res.status === 401) throw new ApiFailure(401, "UNAUTHENTICATED", "Your session has ended. Please sign in again.")
    throw new ApiFailure(res.status, e?.code ?? "ERROR", e?.message ?? "Something went wrong.", Array.isArray(e?.details) ? e.details : [])
  }
  return json?.data as T
}

/** Message to show for any thrown value from adminApi. */
export const failureMessage = (e: unknown) => (e instanceof ApiFailure ? e.message : "Something went wrong. Please try again.")
