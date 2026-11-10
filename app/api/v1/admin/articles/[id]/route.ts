import { ok, route } from "@/lib/api/http"
import { articleBody, uuid } from "@/lib/api/schemas"
import { saveArticle, type SaveArticleInput } from "@/lib/db/queries"

export const PUT = route<{ id: string }>(async ({ params, require, json }) => { require("content:write"); return ok({ id: await saveArticle({ ...((await json(articleBody)) as unknown as SaveArticleInput), id: uuid.parse(params.id) }) }) })
