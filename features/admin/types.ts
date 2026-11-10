export type ProductStatus = "published" | "draft" | "archived"
export type AdminProduct = {
  id: string; title: string; slug: string; sku: string; category: string; brand: string
  pricePaise: number; comparePaise: number | null; gstPercent: number
  stock: number; reserved: number; reorderAt: number
  status: ProductStatus; description: string; seoTitle: string; seoDescription: string; createdAt: string
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
export type AdminBanner = { id: string; title: string; slot: string; starts: string; ends: string; href: string; paused: boolean }
export type ReturnStatus = "requested" | "approved" | "received" | "refunded" | "rejected"
export type AdminReturn = { id: string; orderId: string; customerName: string; reason: string; refundPaise: number; status: ReturnStatus; requested: string }
export type AdminArticle = { id: string; title: string; slug: string; author: string; updated: string; published: boolean }

export type Settings = {
  storeName: string; supportEmail: string; phone: string; gstin: string
  freeDeliveryAboveRupees: number; shippingFeeRupees: number; returnDays: number
  razorpayMode: "test" | "live"; lowStockDefault: number
  notifyNewOrder: boolean; notifyLowStock: boolean; notifyReturn: boolean
}
