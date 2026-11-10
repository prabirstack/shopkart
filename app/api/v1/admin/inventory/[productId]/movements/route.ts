import { ok, route } from "@/lib/api/http"
import { uuid } from "@/lib/api/schemas"
import { listMovements } from "@/lib/db/queries"

export const GET = route<{ productId: string }>(async ({ params, require }) => { require("inventory:read"); return ok(await listMovements(uuid.parse(params.productId))) })
