import { noContent, ok, route } from "@/lib/api/http"
import { addressBody, uuid } from "@/lib/api/schemas"
import { deleteAddress, saveAddress } from "@/lib/db/queries"

export const PUT = route<{ id: string }>(async ({ params, json, user }) => ok(await saveAddress(user().userId, await json(addressBody), uuid.parse(params.id))))
export const DELETE = route<{ id: string }>(async ({ params, user }) => { await deleteAddress(user().userId, uuid.parse(params.id)); return noContent() })
