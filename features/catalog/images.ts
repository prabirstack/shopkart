import manifest from "./image-manifest.json"

/**
 * Where product photos come from, in order: the product's own images (uploaded in the admin, stored in the database
 * and loaded with the product), then the demo files listed in the manifest (public/images, see docs/images.md),
 * then the icon placeholder. A missing photo never breaks a page.
 */
const m = manifest as { products: Record<string, string[]>; categories: Record<string, string>; campaigns: Record<string, string> }

export type ProductImage = { url: string; alt: string }

/** Demo files for a product, main image first. Empty array means "use the placeholder". */
export const productImages = (slug: string): string[] => m.products[slug] ?? []
export const productImage = (slug: string): string | null => m.products[slug]?.[0] ?? null

/** All photos to show for a product: its own when it has any, otherwise the demo files. */
export const productPhotos = (slug: string, images?: ProductImage[]): ProductImage[] =>
  images?.length ? images : productImages(slug).map((url) => ({ url, alt: "" }))

export const categoryImage = (slug: string): string | null => m.categories[slug] ?? null
export const campaignImage = (id: string): string | null => m.campaigns[id] ?? null
