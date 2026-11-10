import { ok, route } from "@/lib/api/http"
import { settingsBody } from "@/lib/api/schemas"
import { getSettings, saveSettings } from "@/lib/db/queries"

export const GET = route(async ({ require }) => { require("settings:write"); return ok(await getSettings()) })
export const PUT = route(async ({ require, json }) => { const me = require("settings:write"); await saveSettings(await json(settingsBody), me.userId); return ok(await getSettings()) })
