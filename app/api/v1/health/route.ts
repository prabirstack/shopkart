import { sql } from "drizzle-orm"

import { ok, route } from "@/lib/api/http"
import { db } from "@/lib/db"

/** Liveness and database check for load balancers and uptime monitors. */
export const GET = route(async () => { await db.execute(sql`select 1`); return ok({ status: "ok", time: new Date().toISOString() }) })
