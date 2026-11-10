import { created, ok, route } from "@/lib/api/http"
import { articleBody } from "@/lib/api/schemas"
import { listArticlesForAdmin, saveArticle, type SaveArticleInput } from "@/lib/db/queries"

export const GET = route(async ({ require }) => { require("content:write"); return ok(await listArticlesForAdmin()) })
export const POST = route(async ({ require, json }) => { require("content:write"); const id = await saveArticle((await json(articleBody)) as unknown as SaveArticleInput); return created({ id }) }, { invalidates: ["content"] })
