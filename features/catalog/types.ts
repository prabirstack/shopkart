/**
 * The storefront's view of a product. It is plain JSON (no components), so it can be passed from server
 * components to client components and returned by the API. How a product looks (icon, tint) is derived from
 * its category in features/catalog/category-meta.ts, never stored on the product.
 */
export type Product = {
  id: string
  slug: string
  title: string
  /** Category slug, for example "kitchen-dining". */
  category: string
  brand: string
  pricePaise: number
  comparePaise?: number
  badge?: string
  /** Average rating to one decimal, when there are reviews. */
  rating?: number
  ratingCount: number
  /** Compact review count for display, like "3.2K". */
  reviews?: string
  /** Units available right now (on hand minus reserved). */
  stock: number
  gstPercent: number
  description: string
  /** Photos in display order (the first is the card image). Missing or empty means "use the demo file or the placeholder". */
  images?: { url: string; alt: string }[]
}

/** A category as listed in the shop, with how many published products it holds. */
export type StoreCategory = { slug: string; name: string; short: string; count: number }

/** Percentage discount shown on a deal badge; derived, never typed by hand. */
export const discountPercent = (p: Pick<Product, "pricePaise" | "comparePaise">) =>
  p.comparePaise && p.comparePaise > p.pricePaise ? Math.round(((p.comparePaise - p.pricePaise) / p.comparePaise) * 100) : 0

/** 3200 -> "3.2K", 980 -> "980". */
export const formatCount = (n: number) => (n >= 1000 ? `${(Math.round(n / 100) / 10).toString().replace(/\.0$/, "")}K` : String(n))

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
