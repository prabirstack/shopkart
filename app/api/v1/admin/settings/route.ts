import { ok, route } from "@/lib/api/http"
import { storeSettingsBody } from "@/lib/api/schemas"
import { getSettings, saveSettings } from "@/lib/db/queries"

export const GET = route(async ({ require }) => { require("settings:write"); return ok(await getSettings()) })
export const PUT = route(async ({ require, json }) => { const me = require("settings:write"); await saveSettings(await json(storeSettingsBody), me.userId); return ok(await getSettings()) })
