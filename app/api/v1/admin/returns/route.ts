import { z } from "zod"

import { ok, route } from "@/lib/api/http"
import { listReturns } from "@/lib/db/queries"

const q = z.object({ status: z.enum(["requested", "approved", "received", "refunded", "rejected"]).optional() })

export const GET = route(async ({ require, query }) => { require("returns:manage"); return ok(await listReturns(query(q).status)) })
