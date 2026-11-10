import { randomBytes } from "node:crypto"
import { z } from "zod"
import { checkoutSchema } from "@/features/checkout/schema"
import { buildOrderQuote } from "@/features/checkout/server-quote"
import { signOrder, type OrderSnapshot } from "@/features/orders/token"

const body = z.object({
  items: z.array(z.object({ id: z.string().max(40), quantity: z.number() })).max(50),
  coupon: z.string().max(40).nullable(),
  customer: checkoutSchema,
})

const fail = (status: number, code: string, message: string) => Response.json({ error: { code, message } }, { status })

/** Step 1: validate, price the cart on the server and create a (mock) gateway order. */
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return fail(400, "INVALID_INPUT", "Please check your details and try again.")
  const { items, coupon, customer } = parsed.data

  const priced = buildOrderQuote(items, coupon)
  if ("error" in priced) return fail(409, "CART_CHANGED", priced.error)

  const orderId = `order_mock_${randomBytes(8).toString("hex")}`
  const { terms, ...address } = customer
  void terms // consent is recorded by the form, not stored on the order snapshot
  const snapshot: OrderSnapshot = { orderId, couponCode: priced.couponCode, lines: priced.lines, totals: priced.totals, customer: address }
  return Response.json({
    orderId,
    amountPaise: priced.totals.totalPaise,
    currency: "INR",
    orderToken: await signOrder(snapshot, "30m"),
  })
}
