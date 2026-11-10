import "server-only"

// A small client for the two Razorpay API calls the shop needs. Authentication is HTTP Basic with the key id and
// key secret (server side only; the secret never reaches the browser). Test keys start with `rzp_test_` and use
// Razorpay's test mode: no real money moves. Every call has a timeout, and errors carry Razorpay's own description
// (safe to log) but never the credentials.

const BASE = "https://api.razorpay.com/v1"

export class RazorpayError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string) { super(message); this.name = "RazorpayError" }
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET
  if (!id || !secret) throw new RazorpayError(500, "Razorpay keys are not configured.")
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST", headers: { "content-type": "application/json", authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
      body: JSON.stringify(body), signal: AbortSignal.timeout(10_000), cache: "no-store",
    })
  } catch (e) {
    throw new RazorpayError(0, e instanceof Error && e.name === "TimeoutError" ? "Razorpay did not respond in time." : "Could not reach Razorpay.")
  }
  const json = (await res.json().catch(() => null)) as (T & { error?: { code?: string; description?: string } }) | null
  if (!res.ok || !json) throw new RazorpayError(res.status, json?.error?.description ?? `Razorpay returned ${res.status}.`, json?.error?.code)
  return json
}

/** Creates the gateway-side order that the checkout popup pays against. Amounts are in paise, like ours. */
export async function createRazorpayOrder(input: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<{ id: string; amount: number; currency: string }> {
  const o = await call<{ id: string; amount: number; currency: string }>("/orders", { amount: input.amountPaise, currency: "INR", receipt: input.receipt.slice(0, 40), notes: input.notes })
  if (!o.id?.startsWith("order_") || o.amount !== input.amountPaise) throw new RazorpayError(502, "Razorpay returned an unexpected order.")
  return o
}

/** Sends money back to the customer for a captured payment (full or partial). Returns Razorpay's refund id. */
export async function refundRazorpayPayment(input: { paymentId: string; amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<{ id: string }> {
  if (!/^pay_[A-Za-z0-9]+$/.test(input.paymentId)) throw new RazorpayError(400, "Not a Razorpay payment id.")
  const r = await call<{ id: string }>(`/payments/${input.paymentId}/refund`, { amount: input.amountPaise, speed: "normal", receipt: input.receipt.slice(0, 40), notes: input.notes })
  if (!r.id?.startsWith("rfnd_")) throw new RazorpayError(502, "Razorpay returned an unexpected refund.")
  return r
}
