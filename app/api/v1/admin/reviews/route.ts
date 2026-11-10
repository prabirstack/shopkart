import { z } from "zod"

import { ok, route } from "@/lib/api/http"
import { listReviewsForModeration } from "@/lib/db/queries"

const q = z.object({ status: z.enum(["pending", "approved", "rejected"]).default("pending") })

export const GET = route(async ({ require, query }) => { require("reviews:moderate"); return ok(await listReviewsForModeration(query(q).status)) })
