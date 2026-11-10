import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { paymentSecret } from "@/features/payments/signature"

export type OrderLine = { id: string; title: string; pricePaise: number; quantity: number; gstPercent: number }
export type OrderSnapshot = {
  orderId: string
  couponCode: string | null
  lines: OrderLine[]
  totals: { subtotalPaise: number; discountPaise: number; shippingPaise: number; gstIncludedPaise: number; totalPaise: number }
  customer: { fullName: string; email: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string }
}
export type PaidOrder = OrderSnapshot & { paymentId: string; paidAt: string }

const key = () => new TextEncoder().encode(paymentSecret())

/** Pending orders are signed so the verify step never trusts amounts sent by the browser. */
export async function signOrder(payload: OrderSnapshot | PaidOrder, expiresIn: string): Promise<string> {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresIn).sign(key())
}

export async function readOrder<T extends OrderSnapshot>(token: string): Promise<T | null> {
  try { return (await jwtVerify(token, key(), { algorithms: ["HS256"] })).payload as unknown as T } catch { return null }
}

export const orderNumber = (orderId: string) => `SK-${orderId.replace(/\D/g, "").slice(0, 5).padEnd(5, "0")}`
