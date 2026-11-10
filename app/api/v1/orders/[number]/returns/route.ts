import { created, ok, route } from "@/lib/api/http"
import { createReturn, listReturnsForOrder } from "@/lib/db/queries"
import { createReturnBody } from "@/lib/returns"

/** The signed-in customer's returns for one of their own orders. Someone else's order number is simply "not found". */
export const GET = route<{ number: string }>(async ({ params, user }) => ok(await listReturnsForOrder(params.number, user().userId)))

/**
 * Files a return for a delivered order inside the return window. The body only says which lines, how many units and why;
 * the refund is worked out here from the stored order and never taken from the client.
 */
export const POST = route<{ number: string }>(async ({ params, user, json }) => {
  const me = user()
  const body = await json(createReturnBody)
  return created(await createReturn({ number: params.number, userId: me.userId, ...body }))
}, { limit: { max: 10, windowSec: 60 } })
