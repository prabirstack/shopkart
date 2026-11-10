import { formatMoney } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE, RETURN_WINDOW_DAYS, SHIPPING_FEE_PAISE } from "@/lib/store-config"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

/** Policy numbers come from lib/store-config.ts, the same values checkout uses. */
export const policy = {
  freeDelivery: rupees(FREE_DELIVERY_ABOVE_PAISE),
  shippingFee: rupees(SHIPPING_FEE_PAISE),
  returnDays: RETURN_WINDOW_DAYS,
}

export type Faq = { q: string; a: string; topic: "Orders" | "Delivery" | "Returns" | "Payments" | "Account" }

export const faqs: Faq[] = [
  { topic: "Orders", q: "How do I track my order?", a: "Open Help, then Track your order, and enter your order number and email. Signed-in customers can also see live status under Account, then Orders." },
  { topic: "Orders", q: "Can I change or cancel an order?", a: "You can cancel until it is packed. After that, refuse the delivery or start a return once it arrives. Contact us quickly with your order number." },
  { topic: "Delivery", q: "How much is delivery?", a: `Delivery is free on orders above ${policy.freeDelivery}. Below that, a flat ${policy.shippingFee} delivery fee applies. The cart shows exactly how much more you need for free delivery.` },
  { topic: "Delivery", q: "How long does delivery take?", a: "Most orders arrive in 3 to 5 working days after they are packed. Remote pin codes can take longer; you see the estimate before you pay." },
  { topic: "Returns", q: "What is the return policy?", a: `You can return most products within ${policy.returnDays} days of delivery if they are unused and in original packaging. Some categories, such as opened personal care items, cannot be returned.` },
  { topic: "Returns", q: "When will I get my refund?", a: "Refunds go back to your original payment method after the returned item passes inspection. Banks can take 5 to 7 working days to show it." },
  { topic: "Payments", q: "Which payment methods do you accept?", a: "We accept UPI, cards, netbanking and wallets through Razorpay. We never see or store your card or UPI details." },
  { topic: "Payments", q: "Do I get a GST invoice?", a: "Yes. Prices include GST, and every paid order has a tax invoice with the GST split. Find it under Account, then Billing history." },
  { topic: "Payments", q: "How do coupons work?", a: "Enter a code in your cart or at checkout. Each coupon has a minimum order, an expiry date and usage limits, shown in Account, then Coupons." },
  { topic: "Account", q: "Do I need an account to shop?", a: "You can browse, search and fill a cart without one. A verified account is needed to check out so we can show your orders and invoices." },
]
