// Shared by the server (validation, storage) and the admin screens (hints, pre-checks).
// No Node or server-only imports here: the browser bundles this file too.

export type MediaKind = "product" | "banner"

export const MEDIA_DIR: Record<MediaKind, string> = { product: "products", banner: "banners" }

/** Hard limits. The client checks the same numbers first so people get the message before uploading. */
export const MEDIA_LIMITS = {
  /** One photo, as sent by the browser. */
  maxFileBytes: 5 * 1024 * 1024,
  /** The whole request, including multipart framing. Anything bigger is refused before it is read. */
  maxBodyBytes: 6 * 1024 * 1024,
  /** Source files bigger than this in either direction are refused (decoding them would use too much memory). */
  maxSourcePx: 6000,
  /** Products need a sharp main photo: the long side must be at least this. */
  minProductPx: 400,
  minBannerWidthPx: 600,
  maxProductPx: 2000,
  maxBannerWidthPx: 2400,
  maxImagesPerProduct: 8,
  altMax: 160,
} as const

/** What the picker offers and what the server accepts, by content (not by file name). */
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",")

/** Recommended artwork size per banner placement, shown in the banner form. */
export const BANNER_SIZES = {
  home_hero: { width: 1600, height: 600, note: "Keep the headline area clear: the title and button are drawn over the left side." },
  home_promo_grid: { width: 800, height: 800, note: "Square tiles." },
  category_banner: { width: 1600, height: 400, note: "Wide and short." },
  cart_banner: { width: 1200, height: 300, note: "Wide and short." },
} as const

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
const KEY = (kind: MediaKind) => new RegExp(`^${MEDIA_DIR[kind]}/${UUID}\\.webp$`)

/** True for `products/<uuid>.webp` / `banners/<uuid>.webp` and nothing else. This is the only key shape we ever read or write. */
export const isMediaKey = (key: string, kind?: MediaKind) => (kind ? KEY(kind).test(key) : KEY("product").test(key) || KEY("banner").test(key))

export const mediaUrl = (key: string) => `/media/${key}`

/** The storage key behind one of our own `/media/...` URLs, or null for anything else (external URLs, data:, odd paths). */
export function keyFromUrl(url: string, kind?: MediaKind): string | null {
  if (!url.startsWith("/media/")) return null
  const key = url.slice("/media/".length)
  return isMediaKey(key, kind) ? key : null
}

/** Demo photos that ship in public/images/products. Allowed on products so seeded products can be edited without losing them. */
export const isLegacyProductImage = (url: string) => /^\/images\/products\/[a-z0-9][a-z0-9-]*\.(webp|avif|jpe?g|png)$/.test(url)

/** Same messages on the client (before upload) and on the server (after). */
export const UPLOAD_MESSAGES = {
  type: "Use a JPG, PNG, WebP or AVIF photo. SVG, GIF and other files can't be uploaded.",
  tooBig: "That photo is over 5 MB. Export a smaller one and try again.",
  empty: "That file is empty.",
} as const
