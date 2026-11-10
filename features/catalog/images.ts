import manifest from "./image-manifest.json"

/**
 * Photos are optional. Everything falls back to the icon placeholder when a file is
 * missing, so the store looks complete before, during and after you add real images.
 * Add files, then run `pnpm images` to refresh the manifest (see docs/images.md).
 */
const m = manifest as { products: Record<string, string[]>; categories: Record<string, string>; campaigns: Record<string, string> }

/** All image URLs for a product, main image first. Empty array means "use the placeholder". */
export const productImages = (slug: string): string[] => m.products[slug] ?? []
export const productImage = (slug: string): string | null => m.products[slug]?.[0] ?? null
export const categoryImage = (slug: string): string | null => m.categories[slug] ?? null
export const campaignImage = (id: string): string | null => m.campaigns[id] ?? null
