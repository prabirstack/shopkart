import type { Product } from "./types"
import { formatMoney } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE, RETURN_WINDOW_DAYS } from "@/lib/store-config"

// Sample specification and FAQ text for the demo store. Real products store these
// as structured fields set by the merchant in the dashboard.

const CATEGORY_NAMES: Record<string, string> = {
  electronics: "Electronics", mobiles: "Mobiles & Tablets", laptops: "Laptops", fashion: "Fashion", "home-living": "Home & Living", "kitchen-dining": "Kitchen & Dining",
  beauty: "Beauty & Personal Care", sports: "Sports & Outdoors", toys: "Toys & Games", books: "Books & Stationery", automotive: "Automotive", gaming: "Gaming", fitness: "Sports & Fitness",
}
/** Display name for a category slug, with a readable fallback for categories added later. */
const categoryName = (slug: string) => CATEGORY_NAMES[slug] ?? slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())
const skuFor = (p: Product) => `SK-${p.id.slice(0, 8).toUpperCase()}`

const electronic = new Set(["electronics", "mobiles", "laptops", "gaming", "fitness"])

export const warrantyFor = (p: Product) => (electronic.has(p.category) ? "1 year brand warranty" : "Brand warranty as per manufacturer")

const extra: Record<string, [string, string][]> = {
  electronics: [["Connectivity", "Bluetooth 5.x"], ["Battery life", "Up to 28 hours (with case)"], ["Charging", "USB-C"]],
  mobiles: [["Display", "6.5 inch"], ["Storage", "128 GB"], ["Charging", "Fast charging, USB-C"]],
  laptops: [["Display", "14 inch"], ["Memory", "16 GB RAM"], ["Storage", "SSD"]],
  "kitchen-dining": [["Power", "1500 W (approx.)"], ["Capacity", "As per product title"], ["Cleaning", "Removable, easy-clean parts"]],
  fashion: [["Material", "Breathable, durable fabric"], ["Care", "Machine washable or wipe clean"], ["Fit", "Regular"]],
  fitness: [["Water resistance", "Splash resistant"], ["Sensors", "Heart rate, motion"], ["Battery life", "Up to 14 days"]],
  gaming: [["Connectivity", "Wireless 2.4 GHz + Bluetooth"], ["Battery life", "Up to 30 hours"], ["Compatibility", "PC and consoles"]],
  "home-living": [["Material", "Solid wood frame, fabric upholstery"], ["Assembly", "Basic assembly required"], ["Care", "Spot clean"]],
  beauty: [["Size", "30 ml"], ["Skin type", "All skin types"], ["Shelf life", "24 months from manufacture"]],
  toys: [["Age", "6 years and above"], ["Pieces", "500"], ["Material", "Child-safe ABS plastic"]],
}

export function specsFor(p: Product): [string, string][] {
  return [
    ["Brand", p.brand],
    ["Model", p.slug.toUpperCase().replace(/-/g, " ")],
    ["Category", categoryName(p.category)],
    ...(extra[p.category] ?? []),
    ["Warranty", warrantyFor(p)],
    ["GST rate", `${p.gstPercent}%`],
    ["SKU", skuFor(p)],
  ]
}

export type SpecGroup = { title: string; rows: [string, string][] }

/** Specifications grouped for the tabbed layout. */
export function specGroups(p: Product): SpecGroup[] {
  return [
    { title: "General", rows: [["Brand", p.brand], ["Model", p.slug.toUpperCase().replace(/-/g, " ")], ["Category", categoryName(p.category)], ["SKU", skuFor(p)]] },
    ...(extra[p.category] ? [{ title: "Features", rows: extra[p.category] }] : []),
    { title: "Warranty & tax", rows: [["Warranty", warrantyFor(p)], ["GST rate", `${p.gstPercent}%`], ["Returns", `${RETURN_WINDOW_DAYS} days from delivery`]] },
  ]
}

export const highlightsFor = (p: Product) => [
  `${p.brand} product, sold by ShopKart with a GST invoice`,
  warrantyFor(p),
  `${RETURN_WINDOW_DAYS}-day easy returns on unused items`,
  `Free delivery on orders above ${formatMoney(FREE_DELIVERY_ABOVE_PAISE, undefined, undefined, { hideZeroDecimals: true })}`,
]

export type ProductFaq = { q: string; a: string }
export function faqsFor(p: Product): ProductFaq[] {
  const free = formatMoney(FREE_DELIVERY_ABOVE_PAISE, undefined, undefined, { hideZeroDecimals: true })
  return [
    { q: `Is the ${p.title} genuine?`, a: `Yes. It is a ${p.brand} product supplied with a GST tax invoice, and it carries ${warrantyFor(p).toLowerCase()}.` },
    { q: "Does the price include GST?", a: `Yes. The price shown includes ${p.gstPercent}% GST. Your invoice shows the taxable amount and the GST split.` },
    { q: "How long will delivery take?", a: `Most orders arrive in 3 to 5 working days after packing. Enter your PIN code above for an estimate. Delivery is free above ${free}.` },
    { q: "Can I return it if I change my mind?", a: `Yes, within ${RETURN_WINDOW_DAYS} days of delivery if it is unused and in original packaging. Start a return from Account, Orders.` },
    { q: "Which payment methods can I use?", a: "UPI, cards, netbanking and wallets through Razorpay. We never see or store your card or UPI details." },
    { q: "What if it arrives damaged or faulty?", a: "Contact us with your order number and a photo. We will arrange a replacement or refund, and the brand warranty covers manufacturing faults." },
    ...(p.stock > 0 && p.stock <= 10 ? [{ q: "Is stock limited?", a: `Stock is low right now, with ${p.stock} left. Orders are confirmed on payment, so complete checkout to secure yours.` }] : []),
  ]
}
