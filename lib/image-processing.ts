import "server-only"

import sharp from "sharp"

import { DomainError } from "@/lib/db/queries/errors"
import { MEDIA_LIMITS, UPLOAD_MESSAGES, type MediaKind } from "./media"

/** What the bytes really are, judged from the file's first bytes. The client's content-type and file name are never trusted. */
export function sniffImageType(b: Uint8Array): "jpeg" | "png" | "webp" | "avif" | null {
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg"
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png"
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to))
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp"
  // AVIF is an ISO-BMFF file: "ftyp" at byte 4, then a brand of avif or avis (HEIC and others share the container and are refused).
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "avif"
  return null
}

export type ProcessedImage = { bytes: Buffer; width: number; height: number }

/**
 * Validates and re-encodes an upload: WebP at quality 82, EXIF/GPS and every other metadata block dropped (sharp
 * keeps none unless asked), rotated upright, scaled down (never up) to the per-kind maximum with its aspect kept.
 */
export async function processUpload(input: Uint8Array, kind: MediaKind): Promise<ProcessedImage> {
  if (input.byteLength === 0) throw new DomainError("IMAGE_INVALID", UPLOAD_MESSAGES.empty)
  if (!sniffImageType(input)) throw new DomainError("IMAGE_INVALID", UPLOAD_MESSAGES.type)
  const L = MEDIA_LIMITS
  try {
    // limitInputPixels guards against decompression bombs: the header is read first and oversized pictures are refused before decoding.
    const open = () => sharp(input, { limitInputPixels: L.maxSourcePx * L.maxSourcePx, failOn: "error" })
    const meta = await open().metadata()
    // EXIF orientation 5-8 means the picture is stored sideways; the shopper sees it rotated, so judge the rotated size.
    const sideways = (meta.orientation ?? 1) >= 5
    const w = (sideways ? meta.height : meta.width) ?? 0, h = (sideways ? meta.width : meta.height) ?? 0
    if (!w || !h) throw new DomainError("IMAGE_INVALID", "We couldn't read that image. Try exporting it again.")
    if (w > L.maxSourcePx || h > L.maxSourcePx) throw new DomainError("IMAGE_TOO_BIG", `That photo is ${w} x ${h} px. The largest we accept is ${L.maxSourcePx} x ${L.maxSourcePx} px.`)
    if (kind === "product" && Math.max(w, h) < L.minProductPx) throw new DomainError("IMAGE_TOO_SMALL", `That photo is ${w} x ${h} px. Product photos need at least ${L.minProductPx} px on the long side.`)
    if (kind === "banner" && w < L.minBannerWidthPx) throw new DomainError("IMAGE_TOO_SMALL", `That image is ${w} px wide. Banners need at least ${L.minBannerWidthPx} px.`)

    const pipeline = open().rotate().resize(kind === "product"
      ? { width: L.maxProductPx, height: L.maxProductPx, fit: "inside", withoutEnlargement: true }
      : { width: L.maxBannerWidthPx, fit: "inside", withoutEnlargement: true })
    const { data, info } = await pipeline.webp({ quality: 82 }).toBuffer({ resolveWithObject: true })
    return { bytes: data, width: info.width, height: info.height }
  } catch (e) {
    if (e instanceof DomainError) throw e
    console.warn("[uploads] could not decode an image:", (e as Error).message)
    throw new DomainError("IMAGE_INVALID", "We couldn't read that image. It may be damaged. Try exporting it again.")
  }
}
