import "server-only"

import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"

import { MEDIA_DIR, isMediaKey, type MediaKind } from "./media"

/**
 * Where uploaded files live. Callers only ever see this interface and opaque keys like `products/<uuid>.webp`,
 * so moving from disk to object storage later changes one file, not the app.
 *
 * Adding a cloud driver (S3, Cloudflare R2, Vercel Blob):
 *   1. Implement `Storage` below (put = upload, get = download, delete = remove) in a new function.
 *   2. Add a case for it in `getStorage()` and read its keys from env (never commit them).
 *   3. Keep serving through `app/media/[...path]/route.ts` (it validates the key and sets the headers), or
 *      redirect that route to a public bucket URL and add the host to `images.remotePatterns` in next.config.ts.
 * Nothing else needs to change: keys are random, the database stores `/media/<key>`, and orphan clean-up goes through `delete`.
 */
export interface Storage {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>
  get(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
}

/** Every stored file is WebP (uploads are re-encoded), so the type comes from the key, never from the client. */
export const contentTypeFor = (key: string) => (key.endsWith(".webp") ? "image/webp" : "application/octet-stream")

/** Disk, under `.data/uploads` next to the app (git-ignored, and deliberately NOT in `public/`: files added to
 *  `public/` after the server starts are not reliably served in production). Override with UPLOAD_DIR. */
function localDriver(): Storage {
  const root = () => path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), ".data", "uploads"))
  /** Resolves a key to a file path inside the root; anything that is not one of our keys, or that escapes the root, throws. */
  const file = (key: string) => {
    if (!isMediaKey(key)) throw new Error("Invalid storage key.")
    const r = root(), p = path.resolve(r, key)
    if (!p.startsWith(r + path.sep)) throw new Error("Invalid storage key.")
    return p
  }
  return {
    async put(key, bytes) {
      const p = file(key)
      await mkdir(path.dirname(p), { recursive: true })
      // Write beside the target and rename, so a reader never sees half a file.
      const tmp = `${p}.${randomUUID()}.tmp`
      await writeFile(tmp, bytes)
      await rename(tmp, p)
    },
    async get(key) {
      try { return { bytes: await readFile(file(key)), contentType: contentTypeFor(key) } } catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return null; throw e }
    },
    async delete(key) { await rm(file(key), { force: true }) },
    async exists(key) { try { return (await stat(file(key))).isFile() } catch { return false } },
  }
}

export function getStorage(): Storage {
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase()
  if (driver === "local") return localDriver()
  throw new Error(`STORAGE_DRIVER="${driver}" is not implemented. Only "local" exists; see the note at the top of lib/storage.ts to add a cloud driver.`)
}

/** A fresh random key for a new upload. Never derived from the client's file name. */
export const newKey = (kind: MediaKind) => `${MEDIA_DIR[kind]}/${randomUUID()}.webp`
