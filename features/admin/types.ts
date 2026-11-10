export type ProductStatus = "published" | "draft" | "archived"
/** A stored photo. width/height are null for demo files that were never measured. */
export type AdminImage = { url: string; alt: string; width: number | null; height: number | null }
export type AdminProduct = {
  id: string; title: string; slug: string; sku: string; category: string; brand: string
  pricePaise: number; comparePaise: number | null; gstPercent: number
  stock: number; reserved: number; reorderAt: number
  status: ProductStatus; description: string; seoTitle: string; seoDescription: string; createdAt: string
  /** Photos in display order; the first is the main image. */
  images?: AdminImage[]
}

export type OrderStatus = "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded"
export type OrderLine = { productId: string; title: string; quantity: number; pricePaise: number; gstPercent: number }
export type TimelineEvent = { status: OrderStatus; at: string; by: string; note?: string }
export type AdminOrder = {
  id: string; customerId: string; customerName: string; email: string; phone: string; placed: string
  status: OrderStatus; lines: OrderLine[]; discountPaise: number; shippingPaise: number
  paymentMethod: string; paymentId: string; city: string; state: string; pincode: string; addressLine: string
  timeline: TimelineEvent[]; notes: string[]
}

export type Customer = { id: string; name: string; email: string; phone: string; city: string; joined: string; verified: boolean }

export type StockReason = "restock" | "sale" | "damage" | "return" | "correction"
export type StockMovement = { id: string; productId: string; delta: number; reason: StockReason; note: string; at: string; by: string }

export type AdminCoupon = { id: string; code: string; kind: "percent" | "flat"; value: number; minOrderPaise: number; used: number; limit: number; expires: string; active: boolean }
export type AdminBanner = { id: string; title: string; slot: string; starts: string; ends: string; href: string; paused: boolean; image?: AdminImage | null }
export type ReturnStatus = "requested" | "approved" | "received" | "refunded" | "rejected" | "cancelled"
export type AdminReturn = { id: string; /** Human-friendly number like RT-2100. */ number: string; orderId: string; customerName: string; reason: string; /** What the customer wrote, if anything. */ note: string | null; refundPaise: number; status: ReturnStatus; /** ISO timestamp. */ requested: string; /** ISO timestamp, set once the goods are back on the shelf. */ receivedAt: string | null; items: { title: string; quantity: number }[] }

export type Settings = {
  storeName: string; supportEmail: string; phone: string; gstin: string
  freeDeliveryAboveRupees: number; shippingFeeRupees: number; returnDays: number
  razorpayMode: "test" | "live"; lowStockDefault: number
  notifyNewOrder: boolean; notifyLowStock: boolean; notifyReturn: boolean
}

/** Banner placements, as the database stores them and as people read them. */
export const BANNER_SLOT_LABEL = { home_hero: "Home hero", home_promo_grid: "Home promo grid", category_banner: "Category banner", cart_banner: "Cart banner" } as const
export const BANNER_SLOT_FROM_LABEL = Object.fromEntries(Object.entries(BANNER_SLOT_LABEL).map(([k, v]) => [v, k])) as Record<string, keyof typeof BANNER_SLOT_LABEL>

export type ReviewStatus = "pending" | "approved" | "rejected"
export type AdminReview = { id: string; productId: string; productTitle: string; productSlug: string; name: string; rating: number; title: string; body: string; status: ReviewStatus; verified: boolean; date: string }
