import { created, ok, route } from "@/lib/api/http"
import { bannerBody } from "@/lib/api/schemas"
import { createBanner, listBanners } from "@/lib/db/queries"

export const GET = route(async ({ require }) => { require("banners:write"); return ok(await listBanners()) })
export const POST = route(async ({ require, json }) => { require("banners:write"); return created(await createBanner(await json(bannerBody))) }, { invalidates: ["content"] })
