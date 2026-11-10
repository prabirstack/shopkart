// Sample catalog used ONLY by `pnpm db:seed`. The storefront reads the database, not this file.
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
  category: string
  brand: string
  pricePaise: number
  comparePaise?: number
  icon: LucideIcon
  tint: string
  badge?: string
  rating?: number
  reviews?: string
  stock: number
  gstPercent: number
  description: string
}

/** Percentage discount shown on a deal badge; derived, never typed by hand. */
export const discountPercent = (p: Product) =>
  p.comparePaise && p.comparePaise > p.pricePaise
    ? Math.round(((p.comparePaise - p.pricePaise) / p.comparePaise) * 100)
    : 0

const T = "bg-neutral-100"
export const catalog: Product[] = [
  { id: "d1", slug: "wireless-earbuds-anc", title: "Wireless Earbuds with ANC", category: "electronics", brand: "Samsung", pricePaise: 249900, comparePaise: 399900, icon: Headphones, tint: T, rating: 4.5, reviews: "3.2K", stock: 42, gstPercent: 18, description: "Active noise cancelling earbuds with 28 hours of battery life and a pocket-sized charging case." },
  { id: "d2", slug: "smartwatch-series-7", title: "Smartwatch Series 7 (AMOLED)", category: "electronics", brand: "Apple", pricePaise: 499900, comparePaise: 666500, icon: Watch, tint: T, rating: 4.6, reviews: "2.1K", stock: 8, gstPercent: 18, description: "Bright always-on AMOLED display, heart-rate and sleep tracking, and seven-day battery." },
  { id: "d3", slug: "mens-casual-sneakers", title: "Men's Casual Sneakers", category: "fashion", brand: "Nike", pricePaise: 139900, comparePaise: 199900, icon: Shirt, tint: T, rating: 4.3, reviews: "1.8K", stock: 0, gstPercent: 12, description: "Lightweight everyday sneakers with a cushioned sole and breathable upper." },
  { id: "d4", slug: "air-fryer-5-5l", title: "Air Fryer 5.5L (Touch Control)", category: "kitchen-dining", brand: "Philips", pricePaise: 179900, comparePaise: 299900, icon: CookingPot, tint: T, rating: 4.7, reviews: "5.6K", stock: 19, gstPercent: 18, description: "Cook with up to 90% less oil. Touch controls, eight presets and a dishwasher-safe basket." },
  { id: "d5", slug: "laptop-backpack", title: "Laptop Backpack (Water Resistant)", category: "fashion", brand: "Puma", pricePaise: 64900, comparePaise: 99900, icon: Zap, tint: T, rating: 4.2, reviews: "980", stock: 120, gstPercent: 12, description: "Padded 15.6 inch laptop compartment, water-resistant fabric and a hidden anti-theft pocket." },
  { id: "t1", slug: "smartphone-128gb", title: "Smartphone 128GB", category: "mobiles", brand: "Samsung", pricePaise: 1499900, icon: Smartphone, tint: T, badge: "Bestseller", rating: 4.7, reviews: "12.4K", stock: 5, gstPercent: 18, description: "6.5 inch display, 50MP camera and an all-day battery with fast charging." },
  { id: "t2", slug: "wireless-headphones", title: "Wireless Headphones", category: "electronics", brand: "Lenovo", pricePaise: 199900, icon: Headphones, tint: T, badge: "Bestseller", rating: 4.6, reviews: "8.9K", stock: 33, gstPercent: 18, description: "Over-ear Bluetooth headphones with deep bass and 40 hours of playtime." },
  { id: "t3", slug: "electric-rice-cooker", title: "Electric Rice Cooker 1.8L", category: "kitchen-dining", brand: "Tefal", pricePaise: 129900, icon: CookingPot, tint: T, badge: "Trending", rating: 4.8, reviews: "6.1K", stock: 27, gstPercent: 18, description: "One-touch cooking with keep-warm mode and a non-stick inner pot." },
  { id: "t4", slug: "fitness-band", title: "Fitness Band", category: "fitness", brand: "Philips", pricePaise: 69900, icon: Watch, tint: T, badge: "Top Rated", rating: 4.7, reviews: "10.3K", stock: 66, gstPercent: 18, description: "Tracks steps, heart rate and sleep with a 14-day battery and swim-proof design." },
  { id: "t5", slug: "mixer-grinder-750w", title: "Mixer Grinder 750W", category: "kitchen-dining", brand: "Philips", pricePaise: 199900, icon: Zap, tint: T, badge: "Bestseller", rating: 4.6, reviews: "4.9K", stock: 14, gstPercent: 18, description: "Powerful 750W motor with three stainless-steel jars for wet and dry grinding." },
  { id: "x1", slug: "gaming-controller", title: "Wireless Gaming Controller", category: "gaming", brand: "Lenovo", pricePaise: 459900, comparePaise: 549900, icon: Gamepad2, tint: T, rating: 4.5, reviews: "2.4K", stock: 21, gstPercent: 18, description: "Ergonomic wireless controller with programmable buttons and 30 hours of battery." },
  { id: "x2", slug: "yoga-mat", title: "Anti-Slip Yoga Mat 6mm", category: "fitness", brand: "Adidas", pricePaise: 79900, comparePaise: 129900, icon: Dumbbell, tint: T, rating: 4.4, reviews: "1.3K", stock: 58, gstPercent: 12, description: "Dense 6mm cushioning with a textured anti-slip surface and carry strap." },
  { id: "x3", slug: "ultrabook-14", title: "Ultrabook 14 inch, 16GB RAM", category: "laptops", brand: "Lenovo", pricePaise: 5499900, comparePaise: 6299900, icon: Laptop, tint: T, rating: 4.6, reviews: "1.1K", stock: 9, gstPercent: 18, description: "Thin and light 14 inch laptop with a fast SSD and a full-day battery." },
  { id: "x4", slug: "modern-armchair", title: "Modern Accent Armchair", category: "home-living", brand: "Philips", pricePaise: 1299900, comparePaise: 1899900, icon: Armchair, tint: T, rating: 4.4, reviews: "640", stock: 6, gstPercent: 18, description: "Comfortable accent chair with solid wood legs and stain-resistant fabric." },
  { id: "x5", slug: "face-serum", title: "Vitamin C Face Serum 30ml", category: "beauty", brand: "Tefal", pricePaise: 59900, comparePaise: 89900, icon: Sparkles, tint: T, rating: 4.3, reviews: "2.7K", stock: 74, gstPercent: 18, description: "Brightening daily serum with 10% vitamin C, suitable for most skin types." },
  { id: "x6", slug: "building-blocks-set", title: "Building Blocks Set (500 pcs)", category: "toys", brand: "Lenovo", pricePaise: 89900, comparePaise: 119900, icon: ToyBrick, tint: T, rating: 4.8, reviews: "3.9K", stock: 40, gstPercent: 12, description: "Creative building set with 500 colourful pieces. Ages 6 and up." },
]

export const productBySlug = (slug: string) => catalog.find((p) => p.slug === slug)
export const productById = (id: string) => catalog.find((p) => p.id === id)
const pick = (...ids: string[]) => ids.map((id) => productById(id)!)

export const dealProducts: Product[] = pick("d1", "d2", "d3", "d4", "d5")
export const topSelling: Product[] = pick("t1", "t2", "t3", "t4", "t5")
export const recentlyViewed: Product[] = pick("d1", "d3", "d4", "d2")

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

// Curated lists for the "New arrivals", "Bestsellers" and "Top selling" pages.
export const newArrivals: Product[] = pick("x3", "x1", "x6", "x4", "x5", "x2")
export const bestsellers: Product[] = catalog.filter((p) => p.badge === "Bestseller" || (p.rating ?? 0) >= 4.7)
