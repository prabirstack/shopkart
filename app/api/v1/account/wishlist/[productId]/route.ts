import { noContent, route } from "@/lib/api/http"
import { uuid } from "@/lib/api/schemas"
import { addToWishlist, removeFromWishlist } from "@/lib/db/queries"

// PUT and DELETE are idempotent: adding twice or removing something absent is fine.
export const PUT = route<{ productId: string }>(async ({ params, user }) => { await addToWishlist(user().userId, uuid.parse(params.productId)); return noContent() })
export const DELETE = route<{ productId: string }>(async ({ params, user }) => { await removeFromWishlist(user().userId, uuid.parse(params.productId)); return noContent() })
