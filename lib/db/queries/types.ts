import type { ShippingAddress } from "../schema"

export type ProductDTO = {
  id: string; slug: string; sku: string; title: string; description: string
  brand: { name: string; slug: string }
  category: { slug: string; name: string; shortName: string }
  pricePaise: number; comparePaise: number | null; gstPercent: number; badge: string | null
  status: "draft" | "published" | "archived"
  /** Average of all ratings to one decimal, or null when there are none. */
  rating: number | null; ratingCount: number
  /** On hand minus reserved. Never negative. */
  available: number
  images: { url: string; alt: string }[]
  seoTitle: string; seoDescription: string; createdAt: Date
}

export type SearchParams = {
  q?: string; category?: string; brands?: string[]
  minPaise?: number | null; maxPaise?: number | null
  inStock?: boolean; rating?: number; discount?: number
  sort?: "relevance" | "popular" | "price-asc" | "price-desc" | "rating" | "discount" | "newest"
  page?: number; pageSize?: number
}
export type SearchResult = { items: ProductDTO[]; total: number; pages: number; page: number }

export type OrderLineDTO = { productId: string; title: string; sku: string; quantity: number; unitPricePaise: number; gstPercent: number }
export type OrderDTO = {
  id: string; number: string
  status: "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded"
  subtotalPaise: number; discountPaise: number; shippingPaise: number; gstIncludedPaise: number; totalPaise: number
  couponCode: string | null; customerName: string; customerEmail: string; customerPhone: string
  shipTo: ShippingAddress; placedAt: Date
  items: OrderLineDTO[]
  events: { status: string; actorLabel: string; note: string | null; at: Date }[]
  payments: { providerOrderId: string; providerPaymentId: string | null; amountPaise: number; status: string; method: string | null }[]
}

export type ReviewDTO = { id: string; productId: string; authorName: string; rating: number; title: string; body: string; verifiedPurchase: boolean; helpfulCount: number; createdAt: Date }
export type ArticleDTO = {
  id: string; slug: string; title: string; excerpt: string
  category: "buying_guide" | "product_review" | "comparison" | "news"
  authorName: string; status: "draft" | "published"; publishedAt: Date | null; updatedAt: Date
  doc: import("../schema").ArticleDoc; seoTitle: string; seoDescription: string
  featuredProductIds: string[]; compareProductIds: string[]
}
