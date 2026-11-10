import { z } from "zod"

import { ok, route } from "@/lib/api/http"
import { paging } from "@/lib/api/schemas"
import { listOrdersForAdmin } from "@/lib/db/queries"

const q = paging.extend({ status: z.enum(["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"]).optional() })

export const GET = route(async ({ require, query }) => { require("orders:read"); return ok(await listOrdersForAdmin(query(q))) })
