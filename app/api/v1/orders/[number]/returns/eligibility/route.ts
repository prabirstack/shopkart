import { ok, route } from "@/lib/api/http"
import { getReturnEligibility } from "@/lib/db/queries"

/** Whether the customer can still return something from this order, until when, and how many units of each line. */
export const GET = route<{ number: string }>(async ({ params, user }) => ok(await getReturnEligibility(params.number, user().userId)))
