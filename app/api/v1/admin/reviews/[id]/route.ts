import { noContent, ok, route } from "@/lib/api/http"
import { moderateBody, uuid } from "@/lib/api/schemas"
import { deleteReview, moderateReview } from "@/lib/db/queries"

export const PATCH = route<{ id: string }>(async ({ params, require, json }) => {
  const me = require("reviews:moderate")
  return ok(await moderateReview({ reviewId: uuid.parse(params.id), status: (await json(moderateBody)).status, actorId: me.userId }))
}, { invalidates: ["catalog"] })
export const DELETE = route<{ id: string }>(async ({ params, require }) => { const me = require("reviews:moderate"); await deleteReview({ reviewId: uuid.parse(params.id), actorId: me.userId }); return noContent() }, { invalidates: ["catalog"] })
