import { ApiError, created, route } from "@/lib/api/http"
import { isStaff } from "@/lib/api/permissions"
import { DomainError } from "@/lib/db/queries/errors"
import { processUpload } from "@/lib/image-processing"
import { MEDIA_LIMITS, mediaUrl, UPLOAD_MESSAGES, type MediaKind } from "@/lib/media"
import { getStorage, newKey } from "@/lib/storage"

const PERMISSION = { product: "catalog:write", banner: "banners:write" } as const

/**
 * Upload one photo (multipart/form-data: `file`, `kind` = "product" | "banner").
 * The bytes are inspected (magic numbers, size), re-encoded to WebP with metadata removed, stored under a random key,
 * and the URL to save on the product or banner is returned. Nothing is attached to anything yet: the file only becomes
 * part of a product or banner when that record is saved.
 */
export const POST = route(async ({ user, require, form }) => {
  // Customers are refused before we read a megabyte of their body; the per-kind permission is checked once we know the kind.
  if (!isStaff(user().role)) throw new ApiError(403, "FORBIDDEN", "You don't have permission to do that.")
  const data = await form()
  const kind = data.get("kind")
  if (kind !== "product" && kind !== "banner") throw new ApiError(422, "VALIDATION_FAILED", "Some fields are invalid.", [{ path: "kind", message: "kind must be product or banner." }])
  require(PERMISSION[kind])

  const file = data.get("file")
  if (!(file instanceof File)) throw new ApiError(422, "VALIDATION_FAILED", "Some fields are invalid.", [{ path: "file", message: "Choose a photo to upload." }])
  if (file.size > MEDIA_LIMITS.maxFileBytes) throw new DomainError("FILE_TOO_LARGE", UPLOAD_MESSAGES.tooBig)

  const out = await processUpload(new Uint8Array(await file.arrayBuffer()), kind as MediaKind)
  const key = newKey(kind)
  await getStorage().put(key, out.bytes, "image/webp")
  return created({ url: mediaUrl(key), width: out.width, height: out.height, bytes: out.bytes.byteLength })
}, { limit: { max: 30, windowSec: 60 }, maxBodyBytes: MEDIA_LIMITS.maxBodyBytes })
