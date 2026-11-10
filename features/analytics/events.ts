"use client"
import type { Product } from "@/features/catalog/types"
import { track } from "./track"

const CURRENCY = "INR"
const rupees = (paise: number) => paise / 100

/** GA4 ecommerce item. Prices are in rupees, not paise, as GA expects decimal amounts. */
export type AnalyticsProduct = Pick<Product, "id" | "title" | "pricePaise"> & Partial<Pick<Product, "brand" | "category">>

export const toItem = (p: AnalyticsProduct, quantity = 1) => ({
  item_id: p.id, item_name: p.title, ...(p.brand && { item_brand: p.brand }), ...(p.category && { item_category: p.category }), price: rupees(p.pricePaise), quantity,
})

type Line = { product: AnalyticsProduct; quantity: number }

export const trackViewItem = (p: Product) => track("view_item", { currency: CURRENCY, value: rupees(p.pricePaise), items: [toItem(p)] })
export const trackViewItemList = (listName: string, products: Product[]) => track("view_item_list", { item_list_name: listName, items: products.map((p, i) => ({ ...toItem(p), index: i })) })
export const trackAddToCart = (p: Product, quantity: number) => track("add_to_cart", { currency: CURRENCY, value: rupees(p.pricePaise * quantity), items: [toItem(p, quantity)] })
export const trackRemoveFromCart = (p: Product, quantity: number) => track("remove_from_cart", { currency: CURRENCY, value: rupees(p.pricePaise * quantity), items: [toItem(p, quantity)] })
export const trackAddToWishlist = (p: Product) => track("add_to_wishlist", { currency: CURRENCY, value: rupees(p.pricePaise), items: [toItem(p)] })
export const trackSearch = (term: string) => track("search", { search_term: term.slice(0, 100) })
export const trackShare = (method: string, p: Product) => track("share", { method, content_type: "product", item_id: p.id })
export const trackSelectPromotion = (code: string) => track("select_promotion", { promotion_id: code, promotion_name: code })

export const trackViewCart = (lines: Line[], valuePaise: number) => track("view_cart", { currency: CURRENCY, value: rupees(valuePaise), items: lines.map((l) => toItem(l.product, l.quantity)) })
export const trackBeginCheckout = (lines: Line[], valuePaise: number, coupon: string | null) => track("begin_checkout", { currency: CURRENCY, value: rupees(valuePaise), ...(coupon && { coupon }), items: lines.map((l) => toItem(l.product, l.quantity)) })
export const trackAddPaymentInfo = (lines: Line[], valuePaise: number, paymentType: string) => track("add_payment_info", { currency: CURRENCY, value: rupees(valuePaise), payment_type: paymentType, items: lines.map((l) => toItem(l.product, l.quantity)) })
export const trackPurchase = (o: { orderId: string; totalPaise: number; gstPaise: number; shippingPaise: number; coupon: string | null; lines: Line[] }) =>
  track("purchase", { transaction_id: o.orderId, currency: CURRENCY, value: rupees(o.totalPaise), tax: rupees(o.gstPaise), shipping: rupees(o.shippingPaise), ...(o.coupon && { coupon: o.coupon }), items: o.lines.map((l) => toItem(l.product, l.quantity)) })
