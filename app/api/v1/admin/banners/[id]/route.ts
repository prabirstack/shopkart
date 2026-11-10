import { noContent, ok, route } from "@/lib/api/http"
import { bannerPatch, uuid } from "@/lib/api/schemas"
import { deleteBanner, updateBanner } from "@/lib/db/queries"

export const PATCH = route<{ id: string }>(async ({ params, require, json }) => { require("banners:write"); return ok(await updateBanner(uuid.parse(params.id), await json(bannerPatch))) })
export const DELETE = route<{ id: string }>(async ({ params, require }) => { require("banners:write"); await deleteBanner(uuid.parse(params.id)); return noContent() })
