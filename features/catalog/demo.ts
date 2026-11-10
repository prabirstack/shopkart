// Temporary display data for the layout lesson. A later chapter replaces it
// with database-backed catalog services. Money is in paise (INR minor units).
import {
  Armchair, BookOpen, CookingPot, Dumbbell, Gamepad2, Headphones, Laptop,
  Car, Shirt, Smartphone, Sparkles, ToyBrick, Trophy, Watch, Zap,
  type LucideIcon,
} from "lucide-react"

export type Category = {
  slug: string
  name: string
  short: string
  icon: LucideIcon
  /** Tailwind classes for the pastel tile background and the icon colour. */
  tint: string
  iconColor: string
}

export const categories: Category[] = [
  { slug: "electronics", name: "Electronics", short: "Electronics", icon: Headphones, tint: "bg-violet-100", iconColor: "text-violet-700" },
  { slug: "mobiles", name: "Mobiles & Tablets", short: "Mobiles", icon: Smartphone, tint: "bg-orange-100", iconColor: "text-orange-600" },
  { slug: "laptops", name: "Laptops", short: "Laptops", icon: Laptop, tint: "bg-purple-100", iconColor: "text-purple-700" },
  { slug: "fashion", name: "Fashion", short: "Fashion", icon: Shirt, tint: "bg-amber-100", iconColor: "text-amber-700" },
  { slug: "home-living", name: "Home & Living", short: "Home & Living", icon: Armchair, tint: "bg-emerald-100", iconColor: "text-emerald-700" },
  { slug: "kitchen-dining", name: "Kitchen & Dining", short: "Kitchen", icon: CookingPot, tint: "bg-orange-100", iconColor: "text-orange-700" },
  { slug: "beauty", name: "Beauty & Personal Care", short: "Beauty", icon: Sparkles, tint: "bg-pink-100", iconColor: "text-pink-600" },
  { slug: "sports", name: "Sports & Outdoors", short: "Sports", icon: Trophy, tint: "bg-sky-100", iconColor: "text-sky-700" },
  { slug: "toys", name: "Toys & Games", short: "Toys", icon: ToyBrick, tint: "bg-yellow-100", iconColor: "text-yellow-700" },
  { slug: "books", name: "Books & Stationery", short: "Books", icon: BookOpen, tint: "bg-rose-100", iconColor: "text-rose-700" },
  { slug: "automotive", name: "Automotive", short: "Automotive", icon: Car, tint: "bg-red-100", iconColor: "text-red-600" },
  { slug: "gaming", name: "Gaming", short: "Gaming", icon: Gamepad2, tint: "bg-indigo-100", iconColor: "text-indigo-700" },
  { slug: "fitness", name: "Sports & Fitness", short: "Fitness", icon: Dumbbell, tint: "bg-teal-100", iconColor: "text-teal-700" },
]

export const bySlug = (slug: string) => categories.find((c) => c.slug === slug)!

export type Product = {
  id: string
  slug: string
  title: string
  pricePaise: number
  comparePaise?: number
  icon: LucideIcon
  tint: string
  badge?: string
  rating?: number
  reviews?: string
}

/** Percentage discount shown on a deal badge; derived, never typed by hand. */
export const discountPercent = (p: Product) =>
  p.comparePaise && p.comparePaise > p.pricePaise
    ? Math.round(((p.comparePaise - p.pricePaise) / p.comparePaise) * 100)
    : 0

export const dealProducts: Product[] = [
  { id: "d1", slug: "wireless-earbuds-anc", title: "Wireless Earbuds with ANC", pricePaise: 249900, comparePaise: 399900, icon: Headphones, tint: "bg-neutral-100" },
  { id: "d2", slug: "smartwatch-series-7", title: "Smartwatch Series 7 (AMOLED)", pricePaise: 499900, comparePaise: 666500, icon: Watch, tint: "bg-neutral-100" },
  { id: "d3", slug: "mens-casual-sneakers", title: "Men's Casual Sneakers", pricePaise: 139900, comparePaise: 199900, icon: Shirt, tint: "bg-neutral-100" },
  { id: "d4", slug: "air-fryer-5-5l", title: "Air Fryer 5.5L (Touch Control)", pricePaise: 179900, comparePaise: 299900, icon: CookingPot, tint: "bg-neutral-100" },
  { id: "d5", slug: "laptop-backpack", title: "Laptop Backpack (Water Resistant)", pricePaise: 64900, comparePaise: 99900, icon: Zap, tint: "bg-neutral-100" },
]

export const topSelling: Product[] = [
  { id: "t1", slug: "smartphone-128gb", title: "Smartphone 128GB", pricePaise: 1499900, icon: Smartphone, tint: "bg-neutral-100", badge: "Bestseller", rating: 4.7, reviews: "12.4K" },
  { id: "t2", slug: "wireless-headphones", title: "Wireless Headphones", pricePaise: 199900, icon: Headphones, tint: "bg-neutral-100", badge: "Bestseller", rating: 4.6, reviews: "8.9K" },
  { id: "t3", slug: "electric-rice-cooker", title: "Electric Rice Cooker 1.8L", pricePaise: 129900, icon: CookingPot, tint: "bg-neutral-100", badge: "Trending", rating: 4.8, reviews: "6.1K" },
  { id: "t4", slug: "fitness-band", title: "Fitness Band", pricePaise: 69900, icon: Watch, tint: "bg-neutral-100", badge: "Top Rated", rating: 4.7, reviews: "10.3K" },
  { id: "t5", slug: "mixer-grinder-750w", title: "Mixer Grinder 750W", pricePaise: 199900, icon: Zap, tint: "bg-neutral-100", badge: "Bestseller", rating: 4.6, reviews: "4.9K" },
]

export const recentlyViewed: Product[] = [
  dealProducts[0], dealProducts[2], dealProducts[3], dealProducts[1],
]

export const brands = ["Apple", "Samsung", "Lenovo", "Nike", "Adidas", "Puma", "Philips", "Tefal"]

export type Collection = {
  title: string
  note: string
  href: string
  icon: LucideIcon
  tint: string
}

export const collections: Collection[] = [
  { title: "Work From Home Essentials", note: "", href: "/products", icon: Laptop, tint: "bg-orange-100" },
  { title: "Fitness at Home", note: "Up to 40% OFF", href: "/products", icon: Dumbbell, tint: "bg-pink-100" },
  { title: "Smart Kitchen", note: "Up to 50% OFF", href: "/products", icon: CookingPot, tint: "bg-amber-100" },
  { title: "Travel Essentials", note: "Up to 30% OFF", href: "/products", icon: Armchair, tint: "bg-sky-100" },
]
