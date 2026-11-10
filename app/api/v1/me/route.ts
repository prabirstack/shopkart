import { ok, route } from "@/lib/api/http"
import { getProfile } from "@/lib/db/queries"

// Sign-up, sign-in and sign-out live in Better Auth under /api/auth/*. This returns the signed-in user.
export const GET = route(async ({ user }) => ok(await getProfile(user().userId)))
