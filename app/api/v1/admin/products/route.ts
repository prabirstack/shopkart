import { created, ok, route } from "@/lib/api/http"
import { paging, productBody } from "@/lib/api/schemas"
import { createProduct, listProductsForAdmin } from "@/lib/db/queries"
import { z } from "zod"

const q = paging.extend({ status: z.enum(["draft", "published", "archived"]).optional() })

export const GET = route(async ({ require, query }) => { require("catalog:write"); return ok(await listProductsForAdmin(query(q))) })
export const POST = route(async ({ require, json }) => { const me = require("catalog:write"); return created(await createProduct(await json(productBody), me.userId)) }, { invalidates: ["catalog"] })
