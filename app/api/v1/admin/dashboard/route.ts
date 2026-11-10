import { z } from "zod"

import { ok, route } from "@/lib/api/http"
import { dashboardSummary } from "@/lib/db/queries"

const q = z.object({ days: z.coerce.number().int().min(1).max(365).optional() })

export const GET = route(async ({ require, query }) => { require("reports:read"); return ok(await dashboardSummary(query(q).days ?? 30)) })
