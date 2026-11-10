import { ok, route } from "@/lib/api/http"
import { listRefs } from "@/lib/db/queries"

/** Categories, brands and tax rates, for the product form's dropdowns. */
export const GET = route(async ({ require }) => { require("catalog:write"); return ok(await listRefs()) })
