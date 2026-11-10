import { ok, route } from "@/lib/api/http"
import { paging } from "@/lib/api/schemas"
import { listCustomers } from "@/lib/db/queries"

export const GET = route(async ({ require, query }) => { require("customers:read"); return ok(await listCustomers(query(paging))) })
