import { catalog, productById } from "@/features/catalog/demo"
import type { AdminBanner, AdminCoupon, AdminOrder, AdminProduct, AdminReturn, Customer, OrderStatus, Settings, StockMovement, TimelineEvent } from "./types"

export const customers: Customer[] = [
  { id: "c1", name: "Aarav Mehta", email: "aarav@example.com", phone: "9876543210", city: "Bengaluru", joined: "2026-01-14", verified: true },
  { id: "c2", name: "Diya Nair", email: "diya@example.com", phone: "9811122233", city: "Kochi", joined: "2026-11-02", verified: false },
  { id: "c3", name: "Kabir Shah", email: "kabir@example.com", phone: "9822233344", city: "Mumbai", joined: "2026-03-09", verified: true },
  { id: "c4", name: "Isha Rao", email: "isha@example.com", phone: "9833344455", city: "Hyderabad", joined: "2026-06-21", verified: true },
  { id: "c5", name: "Meera Joshi", email: "meera@example.com", phone: "9844455566", city: "Pune", joined: "2026-08-17", verified: true },
  { id: "c6", name: "Rohan Iyer", email: "rohan@example.com", phone: "9855566677", city: "Chennai", joined: "2026-05-30", verified: true },
  { id: "c7", name: "Ananya Patel", email: "ananya@example.com", phone: "9866677788", city: "Ahmedabad", joined: "2026-09-04", verified: true },
  { id: "c8", name: "Vikram Singh", email: "vikram@example.com", phone: "9877788899", city: "Delhi", joined: "2026-02-11", verified: true },
  { id: "c9", name: "Kavya Reddy", email: "kavya@example.com", phone: "9888899900", city: "Hyderabad", joined: "2026-10-12", verified: false },
  { id: "c10", name: "Imran Sheikh", email: "imran@example.com", phone: "9899900011", city: "Delhi", joined: "2026-07-25", verified: true },
]

export const initialProducts: AdminProduct[] = catalog.map((p, i) => ({
  id: p.id, title: p.title, slug: p.slug, sku: `${p.brand.slice(0, 3).toUpperCase()}-${p.slug.split("-").slice(0, 2).join("-").toUpperCase()}`,
  category: p.category, brand: p.brand, pricePaise: p.pricePaise, comparePaise: p.comparePaise ?? null, gstPercent: p.gstPercent,
  stock: p.stock + 3, reserved: i % 4 === 0 ? 3 : i % 3 === 0 ? 1 : 0, reorderAt: 10,
  status: i === 4 || i === 8 ? "draft" : "published", description: p.description,
  seoTitle: `${p.title} | ShopKart`, seoDescription: p.description.slice(0, 150), createdAt: `2026-0${(i % 9) + 1}-1${i % 9}`,
}))

type Seed = { n: number; cust: number; day: number; lines: [string, number][]; status: OrderStatus; method: string; discount?: number }
const seeds: Seed[] = [
  { n: 10492, cust: 0, day: 0, lines: [["d4", 1], ["t2", 1]], status: "pending", method: "UPI" },
  { n: 10491, cust: 6, day: 0, lines: [["x1", 1]], status: "paid", method: "Card" },
  { n: 10490, cust: 1, day: 1, lines: [["d3", 1]], status: "paid", method: "UPI" },
  { n: 10489, cust: 2, day: 1, lines: [["t1", 1], ["t4", 1]], status: "packed", method: "Card", discount: 150000 },
  { n: 10488, cust: 7, day: 2, lines: [["d2", 1]], status: "shipped", method: "Netbanking" },
  { n: 10487, cust: 3, day: 3, lines: [["d5", 2]], status: "shipped", method: "UPI" },
  { n: 10486, cust: 4, day: 4, lines: [["t3", 1], ["x2", 2]], status: "delivered", method: "UPI" },
  { n: 10485, cust: 8, day: 5, lines: [["x3", 1]], status: "delivered", method: "Card" },
  { n: 10484, cust: 5, day: 6, lines: [["d1", 1]], status: "delivered", method: "Wallet" },
  { n: 10483, cust: 9, day: 7, lines: [["x6", 3]], status: "delivered", method: "UPI" },
  { n: 10482, cust: 0, day: 8, lines: [["t5", 1]], status: "delivered", method: "UPI" },
  { n: 10481, cust: 2, day: 9, lines: [["x5", 2]], status: "cancelled", method: "UPI" },
  { n: 10480, cust: 5, day: 11, lines: [["d5", 1]], status: "refunded", method: "Card" },
  { n: 10479, cust: 4, day: 12, lines: [["x4", 1]], status: "delivered", method: "Netbanking" },
]

const iso = (daysAgo: number, hour: number) => { const d = new Date("2026-11-10T00:00:00Z"); d.setUTCDate(d.getUTCDate() - daysAgo); d.setUTCHours(hour, (hour * 7) % 60); return d.toISOString() }
const flow: OrderStatus[] = ["pending", "paid", "packed", "shipped", "delivered"]

function timelineFor(status: OrderStatus, placed: string): TimelineEvent[] {
  const events: TimelineEvent[] = [{ status: "pending", at: placed, by: "Customer", note: "Order placed" }]
  const target = status === "cancelled" ? 0 : status === "refunded" ? 4 : flow.indexOf(status)
  for (let i = 1; i <= target; i++) {
    const at = new Date(new Date(placed).getTime() + i * 1.5 * 3600_000).toISOString()
    events.push({ status: flow[i], at, by: i === 1 ? "Razorpay" : "Staff" })
  }
  if (status === "cancelled") events.push({ status: "cancelled", at: new Date(new Date(placed).getTime() + 1 * 3600_000).toISOString(), by: "Customer", note: "Cancelled before packing" })
  if (status === "refunded") events.push({ status: "refunded", at: new Date(new Date(placed).getTime() + 4 * 86400_000).toISOString(), by: "Finance", note: "Refund issued to original payment method" })
  return events
}

export const initialOrders: AdminOrder[] = seeds.map((s) => {
  const c = customers[s.cust]
  const placed = iso(s.day, 4 + (s.n % 6))
  const lines = s.lines.map(([id, quantity]) => { const p = productById(id)!; return { productId: id, title: p.title, quantity, pricePaise: p.pricePaise, gstPercent: p.gstPercent } })
  const subtotal = lines.reduce((t, l) => t + l.pricePaise * l.quantity, 0)
  return {
    id: `SK-${s.n}`, customerId: c.id, customerName: c.name, email: c.email, phone: c.phone, placed, status: s.status, lines,
    discountPaise: s.discount ?? 0, shippingPaise: subtotal - (s.discount ?? 0) >= 69900 ? 0 : 4900,
    paymentMethod: s.method, paymentId: `pay_demo_${s.n * 13}`, city: c.city, state: "India", pincode: "560001", addressLine: `${10 + (s.n % 80)} MG Road`,
    timeline: timelineFor(s.status, placed), notes: [],
  }
})

export const initialMovements: StockMovement[] = [
  { id: "m1", productId: "d1", delta: 50, reason: "restock", note: "Supplier delivery PO-2211", at: iso(6, 11), by: "Warehouse" },
  { id: "m2", productId: "d3", delta: -3, reason: "damage", note: "Water damage in transit", at: iso(4, 15), by: "Warehouse" },
  { id: "m3", productId: "t1", delta: 1, reason: "return", note: "Inspected return SK-10480", at: iso(2, 10), by: "Warehouse" },
  { id: "m4", productId: "x2", delta: 24, reason: "restock", note: "Supplier delivery PO-2214", at: iso(1, 12), by: "Warehouse" },
]

export const initialCoupons: AdminCoupon[] = [
  { id: "k1", code: "WELCOME10", kind: "percent", value: 10, minOrderPaise: 49900, used: 214, limit: 1000, expires: "2026-12-31", active: true },
  { id: "k2", code: "FLAT200", kind: "flat", value: 20000, minOrderPaise: 199900, used: 87, limit: 300, expires: "2026-11-30", active: true },
  { id: "k3", code: "WEEKEND20", kind: "percent", value: 20, minOrderPaise: 99900, used: 300, limit: 300, expires: "2026-11-15", active: false },
  { id: "k4", code: "FESTIVE15", kind: "percent", value: 15, minOrderPaise: 149900, used: 0, limit: 500, expires: "2026-12-20", active: true },
]

export const initialBanners: AdminBanner[] = [
  { id: "b1", title: "Mega Tech Fest", slot: "Home hero", starts: "2026-11-01", ends: "2026-11-15", href: "/deals", paused: false },
  { id: "b2", title: "Weekend Deals", slot: "Home promo grid", starts: "2026-11-13", ends: "2026-11-15", href: "/deals", paused: false },
  { id: "b3", title: "Diwali Sale", slot: "Home hero", starts: "2026-10-01", ends: "2026-11-05", href: "/deals", paused: false },
  { id: "b4", title: "Winter Fashion", slot: "Home hero", starts: "2026-11-20", ends: "2026-12-10", href: "/products?category=fashion", paused: false },
]

export const initialReturns: AdminReturn[] = [
  { id: "RT-2034", orderId: "SK-10485", customerName: "Vikram Singh", reason: "Not as described", refundPaise: 5499900, status: "requested", requested: iso(1, 14) },
  { id: "RT-2033", orderId: "SK-10484", customerName: "Rohan Iyer", reason: "Changed my mind", refundPaise: 249900, status: "approved", requested: iso(2, 11) },
  { id: "RT-2032", orderId: "SK-10486", customerName: "Isha Rao", reason: "Wrong size", refundPaise: 159800, status: "received", requested: iso(4, 16) },
  { id: "RT-2031", orderId: "SK-10480", customerName: "Rohan Iyer", reason: "Item arrived damaged", refundPaise: 64900, status: "refunded", requested: iso(9, 10) },
]

export const initialSettings: Settings = {
  storeName: "ShopKart", supportEmail: "support@shopkart.example", phone: "1800-000-0000", gstin: "29ABCDE1234F1Z5",
  freeDeliveryAboveRupees: 699, shippingFeeRupees: 49, returnDays: 7, razorpayMode: "test", lowStockDefault: 10,
  notifyNewOrder: true, notifyLowStock: true, notifyReturn: true,
}
