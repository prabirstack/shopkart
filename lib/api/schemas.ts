import { z } from "zod"

export const uuid = z.string().uuid("Invalid id.")
const text = (min: number, max: number) => z.string().trim().min(min).max(max)
export const email = z.string().trim().toLowerCase().email("Enter a valid email.").max(254)
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.")
const pincode = z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code.")
const paiseAmount = z.number().int().positive().max(100_000_000)
/** Query-string booleans arrive as "true"/"1". */
const flag = z.enum(["true", "1", "false", "0"]).transform((v) => v === "true" || v === "1")
const numberish = z.coerce.number().finite()

export const password = z.string().min(10, "Use at least 10 characters.").max(128)

export const registerBody = z.object({ name: text(2, 60), email, phone: phone.optional(), password })
export const loginBody = z.object({ email, password: z.string().min(1).max(128) })
export const changePasswordBody = z.object({ current: z.string().min(1).max(128), next: password })

export const productQuery = z.object({
  q: z.string().trim().max(80).optional(), category: z.string().max(60).optional(),
  brand: z.string().max(200).optional().transform((v) => v?.split(",").map((b) => b.trim()).filter(Boolean)),
  min: numberish.int().nonnegative().optional(), max: numberish.int().nonnegative().optional(),
  inStock: flag.optional(), rating: numberish.min(1).max(5).optional(), discount: numberish.min(1).max(90).optional(),
  sort: z.enum(["relevance", "popular", "price-asc", "price-desc", "rating", "discount", "newest"]).optional(),
  page: numberish.int().min(1).max(1000).optional(), pageSize: numberish.int().min(1).max(48).optional(),
})

export const paging = z.object({ page: numberish.int().min(1).max(10000).optional(), pageSize: numberish.int().min(1).max(100).optional(), q: z.string().trim().max(80).optional() })

export const reviewBody = z.object({ rating: z.number().int().min(1).max(5), title: text(3, 80), body: text(20, 1500) })

export const couponValidateBody = z.object({ code: text(1, 40), items: z.array(z.object({ productId: uuid, quantity: z.number().int().min(1).max(10) })).min(1).max(50) })

export const addressBody = z.object({ label: text(1, 30).default("Home"), name: text(2, 60), phone, line1: text(3, 120), line2: text(1, 120).nullish(), city: text(2, 60), state: text(2, 60), pincode, isDefault: z.boolean().optional() })

export const createOrderBody = z.object({
  items: z.array(z.object({ productId: uuid, quantity: z.number().int().min(1).max(10) })).min(1).max(50),
  couponCode: text(1, 40).nullish(),
  customer: z.object({ name: text(2, 60), email, phone }),
  shipTo: z.object({ name: text(2, 60), phone, line1: text(3, 120), line2: text(1, 120).optional(), city: text(2, 60), state: text(2, 60), pincode }),
})

export const verifyPaymentBody = z.object({ razorpay_order_id: z.string().max(80), razorpay_payment_id: z.string().max(80), razorpay_signature: z.string().max(200) })

const productShape = z.object({
  title: text(3, 140), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only.").max(100),
  sku: text(2, 40), description: z.string().trim().max(5000).default(""), categoryId: uuid, brandId: uuid, taxCategoryId: uuid,
  pricePaise: paiseAmount, comparePaise: paiseAmount.nullish(), badge: text(1, 24).nullish(), status: z.enum(["draft", "published", "archived"]),
  seoTitle: z.string().trim().max(70).default(""), seoDescription: z.string().trim().max(160).default(""),
  images: z.array(z.object({ url: z.string().trim().max(500).regex(/^(\/|https:\/\/)/, "Use a site path or an https URL."), alt: z.string().max(160).default("") })).max(12).optional(),
  initialStock: z.number().int().min(0).max(100000).optional(), reorderAt: z.number().int().min(0).max(100000).optional(),
})
const compareAbovePrice = { path: ["comparePaise"], message: "The original price must be higher than the selling price." }
export const productBody = productShape.refine((v) => v.comparePaise == null || v.comparePaise > v.pricePaise, compareAbovePrice)
export const productPatch = productShape.omit({ initialStock: true }).partial().refine((v) => v.comparePaise == null || v.pricePaise == null || v.comparePaise > v.pricePaise, { path: ["comparePaise"], message: "The original price must be higher than the selling price." })

export const adjustStockBody = z.object({ delta: z.number().int().min(-100000).max(100000).refine((n) => n !== 0, "Enter a quantity other than zero."), reason: z.enum(["restock", "sale", "damage", "return", "correction"]), note: z.string().trim().max(200).optional(), reference: z.string().trim().max(80).optional() })

export const moderateBody = z.object({ status: z.enum(["pending", "approved", "rejected"]) })

export const articleBody = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(100), title: text(3, 140), excerpt: text(10, 300),
  category: z.enum(["buying_guide", "product_review", "comparison", "news"]), authorName: text(2, 60).default("Team ShopKart"), status: z.enum(["draft", "published"]),
  doc: z.object({ type: z.literal("doc") }).passthrough(), seoTitle: z.string().trim().max(70).default(""), seoDescription: z.string().trim().max(160).default(""),
  featuredProductIds: z.array(uuid).max(12).default([]), compareProductIds: z.array(uuid).max(4).default([]),
})

const date = z.coerce.date()
export const couponBody = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, "3 to 20 letters or digits."), kind: z.enum(["percent", "flat"]), value: z.number().int().positive(), minOrderPaise: z.number().int().min(0).optional(), usageLimit: z.number().int().min(1).max(1_000_000), startsAt: date.nullish(), expiresAt: date, isActive: z.boolean().optional() })
  .refine((v) => v.kind !== "percent" || v.value <= 90, { path: ["value"], message: "A percentage coupon can be at most 90%." })
export const couponPatch = z.object({ kind: z.enum(["percent", "flat"]), value: z.number().int().positive(), minOrderPaise: z.number().int().min(0), usageLimit: z.number().int().min(1).max(1_000_000), startsAt: date.nullable(), expiresAt: date, isActive: z.boolean() }).partial()

export const bannerBody = z.object({ title: text(2, 80), slot: z.enum(["home_hero", "home_promo_grid", "category_banner", "cart_banner"]), startsAt: date, endsAt: date, href: z.string().trim().regex(/^\/[^/\\]/, "Use a link inside the site, like /products.").max(200), isPaused: z.boolean().optional() })
  .refine((v) => v.endsAt >= v.startsAt, { path: ["endsAt"], message: "The end date must be after the start date." })
export const bannerPatch = z.object({ title: text(2, 80), slot: z.enum(["home_hero", "home_promo_grid", "category_banner", "cart_banner"]), startsAt: date, endsAt: date, href: z.string().trim().regex(/^\/[^/\\]/).max(200), isPaused: z.boolean() }).partial()

export const returnStatusBody = z.object({ status: z.enum(["approved", "received", "refunded", "rejected"]) })
export const advanceBody = z.object({ to: z.enum(["packed", "shipped", "delivered"]) })
export const settingsBody = z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.]{0,59}$/), z.unknown()).refine((v) => Object.keys(v).length <= 50, "Too many settings.")
