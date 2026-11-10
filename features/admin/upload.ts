"use client"

import { ApiFailure } from "./api"
import { ACCEPTED_TYPES, MEDIA_LIMITS, UPLOAD_MESSAGES, type MediaKind } from "@/lib/media"

export type UploadedImage = { url: string; width: number; height: number; bytes: number }

/** Checks a file before it is sent, with the same wording the server uses. Returns a message, or null when the file looks fine. */
export function precheckFile(file: File): string | null {
  if (file.size === 0) return UPLOAD_MESSAGES.empty
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) return UPLOAD_MESSAGES.type
  if (file.size > MEDIA_LIMITS.maxFileBytes) return UPLOAD_MESSAGES.tooBig
  return null
}

/** Reads the pixel size in the browser so tiny photos are caught before upload. Resolves null when the browser can't decode the format. */
export async function readDimensions(file: File): Promise<{ width: number; height: number } | null> {
  try { const bmp = await createImageBitmap(file); const d = { width: bmp.width, height: bmp.height }; bmp.close(); return d } catch { return null }
}

/** Plain-language message for a failed upload, by status. */
function messageFor(status: number, serverMessage?: string) {
  if (status === 403) return "You don't have permission to upload photos."
  if (status === 401) return "Your session has ended. Please sign in again."
  if (status === 429) return "You're uploading too fast. Wait a moment, then press Retry."
  if (status === 413) return serverMessage || UPLOAD_MESSAGES.tooBig
  return serverMessage || "The upload failed. Please try again."
}

/**
 * Sends one photo with XMLHttpRequest (fetch can't report upload progress). `onProgress` gets 0 to 1.
 * Rejects with ApiFailure carrying a message that is safe to show.
 */
export function uploadImage(file: File, kind: MediaKind, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/v1/admin/uploads")
    xhr.responseType = "json"
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total) }
    xhr.onload = () => {
      const body = xhr.response as { data?: UploadedImage; error?: { code?: string; message?: string } } | null
      if (xhr.status >= 200 && xhr.status < 300 && body?.data) return resolve(body.data)
      reject(new ApiFailure(xhr.status, body?.error?.code ?? "ERROR", messageFor(xhr.status, body?.error?.message)))
    }
    xhr.onerror = () => reject(new ApiFailure(0, "NETWORK", "Couldn't reach the server. Check your connection, then press Retry."))
    xhr.onabort = () => reject(new ApiFailure(0, "ABORTED", "Upload cancelled."))
    signal?.addEventListener("abort", () => xhr.abort(), { once: true })
    const body = new FormData()
    body.set("kind", kind)
    body.set("file", file)
    xhr.send(body)
  })
}
