import { created, ok, route } from "@/lib/api/http"
import { addressBody } from "@/lib/api/schemas"
import { listAddresses, saveAddress } from "@/lib/db/queries"

export const GET = route(async ({ user }) => ok(await listAddresses(user().userId)))
export const POST = route(async ({ json, user }) => created(await saveAddress(user().userId, await json(addressBody))))
