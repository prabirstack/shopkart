import { contentTypeFor, getStorage } from "@/lib/storage"
import { isMediaKey } from "@/lib/media"

/**
 * Serves uploaded photos (products/<uuid>.webp, banners/<uuid>.webp) from storage. Only that exact key shape is
 * accepted, so there is no way to ask for another file or walk out of the upload folder. Keys are random and a
 * photo is never overwritten (a replacement gets a new key), so browsers and CDNs may cache them forever.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const key = path.join("/")
  if (!isMediaKey(key)) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } })
  const file = await getStorage().get(key)
  if (!file) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } })
  return new Response(file.bytes as BodyInit, {
    headers: {
      "content-type": file.contentType || contentTypeFor(key),
      "content-length": String(file.bytes.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-disposition": "inline",
    },
  })
}
