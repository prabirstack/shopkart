"use client"

export type ApiFailure = { message: string; fields: Record<string, string> }

/**
 * Calls our REST API and returns either the data or a readable failure. Validation errors (422) come back
 * as `fields` so a form can show each message under the right input.
 */
export async function callApi<T = unknown>(url: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown): Promise<{ ok: true; data: T } | ({ ok: false } & ApiFailure)> {
  try {
    const res = await fetch(url, { method, headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) })
    if (res.status === 204) return { ok: true, data: undefined as T }
    const json = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data: json?.data as T }
    const fields: Record<string, string> = {}
    for (const d of Array.isArray(json?.error?.details) ? json.error.details : []) if (typeof d?.path === "string" && d.path && !fields[d.path]) fields[d.path] = String(d.message)
    return { ok: false, message: res.status === 401 ? "Your session has ended. Please sign in again." : json?.error?.message ?? "Something went wrong. Please try again.", fields }
  } catch {
    return { ok: false, message: "Couldn't reach the server. Check your connection and try again.", fields: {} }
  }
}
