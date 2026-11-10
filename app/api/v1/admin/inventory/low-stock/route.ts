import { ok, route } from "@/lib/api/http"
import { lowStock } from "@/lib/db/queries"

export const GET = route(async ({ require }) => { require("inventory:read"); return ok(await lowStock()) })
