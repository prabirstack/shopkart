import { noContent, route } from "@/lib/api/http"
import { uuid } from "@/lib/api/schemas"
import { deleteSubscriber } from "@/lib/db/queries"

export const DELETE = route<{ id: string }>(async ({ params, require }) => {
  const me = require("inbox:manage")
  await deleteSubscriber(uuid.parse(params.id), me.userId)
  return noContent()
})
