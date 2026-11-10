import { ApiError, ok, route } from "@/lib/api/http"
import { getOrderByNumber } from "@/lib/db/queries"

export const GET = route<{ number: string }>(async ({ params, require }) => {
  require("orders:read")
  const o = await getOrderByNumber(params.number)
  if (!o) throw new ApiError(404, "NOT_FOUND", "Order not found.")
  return ok(o)
})
