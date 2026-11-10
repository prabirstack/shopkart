import { Armchair, CookingPot, Dumbbell, Laptop, type LucideIcon } from "lucide-react"

/** Static marketing tiles for the "Buyer's Choice" section. Editorial content, not catalog data. */
export type Collection = { title: string; note: string; href: string; icon: LucideIcon; tint: string }

export const collections: Collection[] = [
  { title: "Work From Home Essentials", note: "", href: "/products", icon: Laptop, tint: "bg-orange-100" },
  { title: "Fitness at Home", note: "Up to 40% OFF", href: "/products", icon: Dumbbell, tint: "bg-pink-100" },
  { title: "Smart Kitchen", note: "Up to 50% OFF", href: "/products", icon: CookingPot, tint: "bg-amber-100" },
  { title: "Travel Essentials", note: "Up to 30% OFF", href: "/products", icon: Armchair, tint: "bg-sky-100" },
]
