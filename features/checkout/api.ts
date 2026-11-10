import type { GatewaySuccess } from "@/features/payments/mock-razorpay-dialog"

/** The order as the checkout needs it: the number to show and what to hand the payment window. */
export type PlacedOrder = { number: string; status: string; providerOrderId: string; amountPaise: number }

type ApiFailure = { ok: false; code: string; message: string; status: number }
type ApiResult<T> = { ok: true; data: T } | ApiFailure

async function call<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } })
    const body = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data: body?.data as T }
    return { ok: false, status: res.status, code: body?.error?.code ?? "ERROR", message: body?.error?.message ?? "Something went wrong." }
  } catch {
    return { ok: false, status: 0, code: "NETWORK", message: "Couldn't reach the server. Check your connection and try again." }
  }
}

/** What to tell the shopper for each failure the orders API can return. */
export function checkoutErrorMessage(f: ApiFailure): string {
  switch (f.code) {
    case "OUT_OF_STOCK": case "INSUFFICIENT_STOCK": return `${f.message} Update your cart and try again.`
    case "PRODUCT_UNAVAILABLE": return `${f.message} Remove it from your cart and try again.`
    case "QUANTITY_LIMIT": case "INVALID_QUANTITY": return `${f.message} Change the quantity in your cart.`
    case "COUPON_INVALID": return `${f.message} Remove the coupon or fix it, then try again.`
    case "EMPTY_CART": return "Your cart is empty."
    case "VALIDATION_FAILED": return "Some of your details look wrong. Please check the form and try again."
    case "UNAUTHENTICATED": case "UNAUTHORIZED": return "Your session has ended. Sign in again to continue."
    case "RATE_LIMITED": return "Too many attempts. Wait a minute and try again."
    case "ORDER_NOT_PAYABLE": return "This order can no longer be paid. Check My orders."
    default: return f.status === 401 ? "Your session has ended. Sign in again to continue." : f.message
  }
}

const toPlaced = (order: { number: string; status: string }, p: { providerOrderId: string; amountPaise: number }): PlacedOrder => ({ number: order.number, status: order.status, providerOrderId: p.providerOrderId, amountPaise: p.amountPaise })

export type NewOrderBody = {
  items: { productId: string; quantity: number }[]
  couponCode: string | null
  customer: { name: string; email: string; phone: string }
  shipTo: { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string }
}

export async function placeOrder(body: NewOrderBody, idempotencyKey: string): Promise<ApiResult<PlacedOrder>> {
  const r = await call<{ order: { number: string; status: string }; payment: { providerOrderId: string; amountPaise: number } }>("/api/v1/orders", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify(body) })
  return r.ok ? { ok: true, data: toPlaced(r.data.order, r.data.payment) } : r
}

/** Reloads an order's payment details so the payment window can be reopened for the same order. */
export async function loadOrder(number: string): Promise<ApiResult<PlacedOrder>> {
  const r = await call<{ number: string; status: string; payments: { providerOrderId: string; amountPaise: number; status: string }[] }>(`/api/v1/orders/${encodeURIComponent(number)}`)
  if (!r.ok) return r
  const p = r.data.payments.find((x) => x.status === "created") ?? r.data.payments[0]
  if (!p) return { ok: false, status: 404, code: "NOT_FOUND", message: "This order has no payment to retry." }
  return { ok: true, data: toPlaced(r.data, p) }
}

export const verifyPayment = (g: GatewaySuccess) => call<unknown>("/api/v1/payments/verify", { method: "POST", body: JSON.stringify(g) })
export const cancelOrder = (number: string) => call<unknown>(`/api/v1/orders/${encodeURIComponent(number)}/cancel`, { method: "POST" })

export type Prefill = { name: string; email: string; phone: string | null; address: { name: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string } | null }

export async function loadPrefill(): Promise<Prefill | null> {
  const [me, addresses] = await Promise.all([call<{ name: string; email: string; phone: string | null }>("/api/v1/me"), call<{ name: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; isDefault: boolean }[]>("/api/v1/account/addresses")])
  if (!me.ok) return null
  const list = addresses.ok ? addresses.data : []
  return { name: me.data.name, email: me.data.email, phone: me.data.phone, address: list.find((a) => a.isDefault) ?? list[0] ?? null }
}
