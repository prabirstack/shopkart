// Demo account data. Real data comes from the database and is filtered by the
// signed-in user's ID in the query itself (never by an ID taken from the URL alone).
import { productById } from "@/features/catalog/demo"
import { quote, type Quote } from "@/lib/pricing"

export const demoUser = { name: "Aarav Mehta", email: "aarav@example.com", phone: "9876543210", joined: "January 2026" }

export type OrderStatus = "processing" | "shipped" | "delivered" | "refunded"

export type Address = { id: string; label: string; name: string; line1: string; line2?: string; city: string; state: string; pincode: string; phone: string; isDefault: boolean }
export const addresses: Address[] = [
  { id: "a1", label: "Home", name: "Aarav Mehta", line1: "12 MG Road", line2: "Near Trinity Circle", city: "Bengaluru", state: "Karnataka", pincode: "560001", phone: "9876543210", isDefault: true },
  { id: "a2", label: "Office", name: "Aarav Mehta", line1: "4th Floor, Prestige Tech Park", city: "Bengaluru", state: "Karnataka", pincode: "560103", phone: "9876543210", isDefault: false },
]

type Seed = { number: string; placed: string; status: OrderStatus; lines: [string, number][]; method: string; coupon?: { kind: "percent" | "flat"; value: number; minOrderPaise: number; code: string }; addressId: string; deliveredOn?: string }
const seeds: Seed[] = [
  { number: "SK-10482", placed: "10 Nov 2026", status: "processing", lines: [["d4", 1], ["t2", 1]], method: "UPI", addressId: "a1" },
  { number: "SK-10401", placed: "02 Nov 2026", status: "shipped", lines: [["d2", 1]], method: "Card ending 1111", addressId: "a1" },
  { number: "SK-10377", placed: "21 Oct 2026", status: "delivered", lines: [["t4", 2], ["x2", 1]], method: "UPI", addressId: "a2", deliveredOn: "26 Oct 2026", coupon: { code: "WELCOME10", kind: "percent", value: 10, minOrderPaise: 49900 } },
  { number: "SK-10290", placed: "03 Oct 2026", status: "delivered", lines: [["t1", 1]], method: "Netbanking", addressId: "a1", deliveredOn: "08 Oct 2026" },
  { number: "SK-10188", placed: "12 Sep 2026", status: "refunded", lines: [["d5", 1]], method: "UPI", addressId: "a1", deliveredOn: "17 Sep 2026" },
]

export type AccountOrder = {
  number: string; placed: string; status: OrderStatus; method: string; paymentId: string; address: Address
  lines: { productId: string; title: string; quantity: number; pricePaise: number; gstPercent: number }[]
  totals: Quote; couponCode: string | null; deliveredOn?: string; invoiceNumber: string
}

export const orders: AccountOrder[] = seeds.map((s, i) => {
  const lines = s.lines.map(([id, quantity]) => { const p = productById(id)!; return { productId: id, title: p.title, quantity, pricePaise: p.pricePaise, gstPercent: p.gstPercent } })
  const coupon = s.coupon ? { ...s.coupon, description: "", expires: "" } : null
  return {
    number: s.number, placed: s.placed, status: s.status, method: s.method, paymentId: `pay_demo_${(i + 1) * 7919 + 100000}`,
    address: addresses.find((a) => a.id === s.addressId)!, lines, couponCode: s.coupon?.code ?? null, deliveredOn: s.deliveredOn,
    totals: quote(lines, coupon), invoiceNumber: `INV-2026-${s.number.slice(3)}`,
  }
})

export const orderByNumber = (n: string) => orders.find((o) => o.number === n)
export const invoiceByNumber = (n: string) => orders.find((o) => o.invoiceNumber === n)

export const TIMELINE = ["Ordered", "Packed", "Shipped", "Out for delivery", "Delivered"] as const
/** How many timeline steps are complete for an order status. */
export const progressFor = (s: OrderStatus) => ({ processing: 2, shipped: 3, delivered: 5, refunded: 5 })[s]
