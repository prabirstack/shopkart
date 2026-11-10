import { z } from "zod"

import { ok, route } from "@/lib/api/http"
import { getProfile, updateProfile } from "@/lib/db/queries"

const patch = z.object({ name: z.string().trim().min(2).max(60).optional(), phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.").nullable().optional() })

export const GET = route(async ({ user }) => ok(await getProfile(user().userId)))
// Email and password changes go through Better Auth (/api/auth/change-email, /api/auth/change-password).
export const PATCH = route(async ({ json, user }) => ok(await updateProfile(user().userId, await json(patch))))
