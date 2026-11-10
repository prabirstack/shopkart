// Temporary dashboard data. Later chapters replace it with permission-checked
// services. Money is in paise (INR minor units).
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "refunded"

export type AdminOrderRow = {
  id: string; customer: string; placed: string; items: number
  totalPaise: number; status: OrderStatus
}

export const recentOrders: AdminOrderRow[] = [
  { id: "SK-10482", customer: "Aarav Mehta", placed: "10 Nov, 09:12", items: 2, totalPaise: 449800, status: "paid" },
  { id: "SK-10481", customer: "Diya Nair", placed: "10 Nov, 08:47", items: 1, totalPaise: 139900, status: "pending" },
  { id: "SK-10480", customer: "Kabir Shah", placed: "09 Nov, 21:30", items: 3, totalPaise: 862500, status: "shipped" },
  { id: "SK-10479", customer: "Isha Rao", placed: "09 Nov, 18:05", items: 1, totalPaise: 64900, status: "delivered" },
  { id: "SK-10478", customer: "Rohan Iyer", placed: "09 Nov, 11:22", items: 2, totalPaise: 299800, status: "refunded" },
  { id: "SK-10477", customer: "Meera Joshi", placed: "08 Nov, 16:40", items: 1, totalPaise: 1499900, status: "delivered" },
]

export type AdminProductRow = {
  id: string; title: string; sku: string; category: string
  pricePaise: number; available: number; gstPercent: number; published: boolean
}

export const adminProducts: AdminProductRow[] = [
  { id: "p1", title: "Wireless Earbuds with ANC", sku: "AUD-ANC-BLK", category: "Electronics", pricePaise: 249900, available: 42, gstPercent: 18, published: true },
  { id: "p2", title: "Smartwatch Series 7 (AMOLED)", sku: "WAT-S7-BLK", category: "Electronics", pricePaise: 499900, available: 8, gstPercent: 18, published: true },
  { id: "p3", title: "Men's Casual Sneakers", sku: "SHO-CAS-WHT-42", category: "Fashion", pricePaise: 139900, available: 0, gstPercent: 12, published: true },
  { id: "p4", title: "Air Fryer 5.5L (Touch Control)", sku: "KIT-AF-55", category: "Kitchen & Dining", pricePaise: 179900, available: 19, gstPercent: 18, published: true },
  { id: "p5", title: "Laptop Backpack (Water Resistant)", sku: "BAG-LAP-BLU", category: "Fashion", pricePaise: 64900, available: 120, gstPercent: 12, published: false },
  { id: "p6", title: "Smartphone 128GB", sku: "MOB-128-GRY", category: "Mobiles & Tablets", pricePaise: 1499900, available: 5, gstPercent: 18, published: true },
  { id: "p7", title: "Fitness Band", sku: "WAT-FB-BLK", category: "Electronics", pricePaise: 69900, available: 66, gstPercent: 18, published: false },
]

export type InventoryRow = {
  sku: string; title: string; onHand: number; reserved: number; reorderAt: number
}

export const inventory: InventoryRow[] = [
  { sku: "AUD-ANC-BLK", title: "Wireless Earbuds with ANC", onHand: 45, reserved: 3, reorderAt: 15 },
  { sku: "WAT-S7-BLK", title: "Smartwatch Series 7 (AMOLED)", onHand: 10, reserved: 2, reorderAt: 10 },
  { sku: "SHO-CAS-WHT-42", title: "Men's Casual Sneakers", onHand: 0, reserved: 0, reorderAt: 12 },
  { sku: "KIT-AF-55", title: "Air Fryer 5.5L (Touch Control)", onHand: 21, reserved: 2, reorderAt: 8 },
  { sku: "MOB-128-GRY", title: "Smartphone 128GB", onHand: 6, reserved: 1, reorderAt: 8 },
]

export const available = (r: InventoryRow) => r.onHand - r.reserved
export const lowStock = inventory.filter((r) => available(r) <= r.reorderAt)

// ---- Returns ----
export type ReturnStatus = "requested" | "approved" | "received" | "refunded" | "rejected"
export type ReturnRow = { id: string; order: string; customer: string; reason: string; refundPaise: number; status: ReturnStatus }
export const returns: ReturnRow[] = [
  { id: "RT-2031", order: "SK-10478", customer: "Rohan Iyer", reason: "Item arrived damaged", refundPaise: 299800, status: "refunded" },
  { id: "RT-2032", order: "SK-10477", customer: "Meera Joshi", reason: "Changed my mind", refundPaise: 1499900, status: "requested" },
  { id: "RT-2033", order: "SK-10479", customer: "Isha Rao", reason: "Wrong size", refundPaise: 64900, status: "approved" },
  { id: "RT-2034", order: "SK-10480", customer: "Kabir Shah", reason: "Not as described", refundPaise: 120000, status: "received" },
]

// ---- Customers ----
export type CustomerRow = { id: string; name: string; email: string; orders: number; spentPaise: number; joined: string; verified: boolean }
export const customers: CustomerRow[] = [
  { id: "u1", name: "Aarav Mehta", email: "aarav@example.com", orders: 5, spentPaise: 1249500, joined: "Jan 2026", verified: true },
  { id: "u2", name: "Diya Nair", email: "diya@example.com", orders: 1, spentPaise: 139900, joined: "Nov 2026", verified: false },
  { id: "u3", name: "Kabir Shah", email: "kabir@example.com", orders: 8, spentPaise: 4120000, joined: "Mar 2026", verified: true },
  { id: "u4", name: "Isha Rao", email: "isha@example.com", orders: 3, spentPaise: 389700, joined: "Jun 2026", verified: true },
  { id: "u5", name: "Meera Joshi", email: "meera@example.com", orders: 2, spentPaise: 1564800, joined: "Aug 2026", verified: true },
]

// ---- Coupons ----
export type CouponRow = {
  code: string; kind: "percent" | "flat"; value: number; minOrderPaise: number
  used: number; limit: number; expires: string; active: boolean
}
export const coupons: CouponRow[] = [
  { code: "WELCOME10", kind: "percent", value: 10, minOrderPaise: 49900, used: 214, limit: 1000, expires: "31 Dec 2026", active: true },
  { code: "FLAT200", kind: "flat", value: 20000, minOrderPaise: 199900, used: 87, limit: 300, expires: "30 Nov 2026", active: true },
  { code: "WEEKEND20", kind: "percent", value: 20, minOrderPaise: 99900, used: 300, limit: 300, expires: "15 Nov 2026", active: false },
]

// ---- Banners ----
export type BannerRow = { id: string; title: string; slot: string; starts: string; ends: string; status: "live" | "scheduled" | "ended" }
export const banners: BannerRow[] = [
  { id: "b1", title: "Mega Tech Fest", slot: "Home hero", starts: "01 Nov 2026", ends: "15 Nov 2026", status: "live" },
  { id: "b2", title: "Weekend Deals", slot: "Home promo grid", starts: "13 Nov 2026", ends: "15 Nov 2026", status: "scheduled" },
  { id: "b3", title: "Diwali Sale", slot: "Home hero", starts: "01 Oct 2026", ends: "05 Nov 2026", status: "ended" },
]

// ---- Articles ----
export type ArticleRow = { id: string; title: string; slug: string; author: string; updated: string; published: boolean }
export const articles: ArticleRow[] = [
  { id: "a1", title: "How to choose wireless earbuds", slug: "choose-wireless-earbuds", author: "Team ShopKart", updated: "08 Nov 2026", published: true },
  { id: "a2", title: "Air fryer buying guide", slug: "air-fryer-buying-guide", author: "Team ShopKart", updated: "05 Nov 2026", published: true },
  { id: "a3", title: "Gift ideas under ₹2,000", slug: "gift-ideas-under-2000", author: "Team ShopKart", updated: "10 Nov 2026", published: false },
]

// ---- GST categories ----
export type TaxCategory = { id: string; name: string; hsn: string; ratePercent: number; products: number }
export const taxCategories: TaxCategory[] = [
  { id: "t1", name: "Electronics & accessories", hsn: "8518", ratePercent: 18, products: 3 },
  { id: "t2", name: "Footwear and bags (under ₹1,000)", hsn: "6403", ratePercent: 12, products: 2 },
  { id: "t3", name: "Small kitchen appliances", hsn: "8516", ratePercent: 18, products: 1 },
  { id: "t4", name: "Printed books", hsn: "4901", ratePercent: 0, products: 0 },
]

// ---- Reports ----
export const salesByCategory = [
  { name: "Electronics", paise: 8420000 },
  { name: "Mobiles & Tablets", paise: 6150000 },
  { name: "Kitchen & Dining", paise: 2890000 },
  { name: "Fashion", paise: 1740000 },
  { name: "Home & Living", paise: 960000 },
]
