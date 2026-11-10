import { z } from "zod"

import { ok, route } from "@/lib/api/http"
import { uuid } from "@/lib/api/schemas"
import { reviewVoteState } from "@/lib/db/queries"

const query = z.object({ ids: z.string().transform((v) => v.split(",").filter(Boolean)).pipe(z.array(uuid).max(50)) })

/** Which of the given reviews the signed-in customer has marked helpful, plus exact counts (the review list itself is shared and cached). */
export const GET = route(async ({ query: q, user }) => {
  const me = user()
  return ok(await reviewVoteState(me.userId, q(query).ids))
})
