// Temporary campaign data. A later chapter replaces it with scheduled, published banners.
export type HeroSlide = {
  id: string
  eyebrow: string
  title: string
  description: string
  href: string
  action: string
}

export const heroSlides: HeroSlide[] = [
  { id: "tech", eyebrow: "Mega Tech Fest", title: "Upgrade Your World", description: "Laptops | Headphones | Smartwatches & More", href: "/products", action: "Shop Now" },
  { id: "home", eyebrow: "Home Refresh", title: "Make Home Yours", description: "Furniture | Decor | Kitchen & More", href: "/products", action: "Explore Home" },
  { id: "style", eyebrow: "New Season", title: "Fresh Fashion Drops", description: "Sneakers | Jackets | Accessories", href: "/products", action: "See New Arrivals" },
]

export type PromoCard = { id: string; title: string; lead: string; highlight: string; href: string }
export const promoCards: PromoCard[] = [
  { id: "fashion", title: "Fashion Refresh", lead: "Up to", highlight: "60% OFF", href: "/products" },
  { id: "home", title: "Home Essentials", lead: "Up to", highlight: "50% OFF", href: "/products" },
  { id: "electronics", title: "Top Electronics", lead: "Up to", highlight: "40% OFF", href: "/products" },
  { id: "weekend", title: "Weekend Deals", lead: "Extra", highlight: "20% OFF", href: "/products" },
]

/** A real end timestamp. The countdown never restarts; it reads "Ended" after this moment. */
export const DEALS_END_AT = "2026-11-15T23:59:59+05:30"
