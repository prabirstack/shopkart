import { z } from "zod"

import { noContent, ok, route } from "@/lib/api/http"
import { articleBody, uuid } from "@/lib/api/schemas"
import { deleteArticle, saveArticle, setArticleStatus, type SaveArticleInput } from "@/lib/db/queries"

export const PUT = route<{ id: string }>(async ({ params, require, json }) => { require("content:write"); return ok({ id: await saveArticle({ ...((await json(articleBody)) as unknown as SaveArticleInput), id: uuid.parse(params.id) }) }) }, { invalidates: ["content"] })

const statusBody = z.object({ status: z.enum(["draft", "published"]) })
export const PATCH = route<{ id: string }>(async ({ params, require, json }) => { require("content:write"); await setArticleStatus(uuid.parse(params.id), (await json(statusBody)).status); return ok({ id: params.id }) }, { invalidates: ["content"] })
export const DELETE = route<{ id: string }>(async ({ params, require }) => { require("content:write"); await deleteArticle(uuid.parse(params.id)); return noContent() }, { invalidates: ["content"] })
