import {
  Armchair, BookOpen, Car, CookingPot, Dumbbell, Gamepad2, Headphones, Laptop, Package, Shirt, Smartphone, Sparkles, ToyBrick, Trophy, type LucideIcon,
} from "lucide-react"

export type CategoryMeta = {
  icon: LucideIcon
  /** Tailwind classes for the pastel tile background and the icon colour. */
  tint: string
  iconColor: string
}

/**
 * How each category looks. Names, slugs and counts come from the database; this only adds the look, and falls
 * back to a neutral tile for any category that isn't listed (for example one added later in the admin).
 */
const META: Record<string, CategoryMeta> = {
  electronics: { icon: Headphones, tint: "bg-violet-100", iconColor: "text-violet-700" },
  mobiles: { icon: Smartphone, tint: "bg-orange-100", iconColor: "text-orange-600" },
  laptops: { icon: Laptop, tint: "bg-purple-100", iconColor: "text-purple-700" },
  fashion: { icon: Shirt, tint: "bg-amber-100", iconColor: "text-amber-700" },
  "home-living": { icon: Armchair, tint: "bg-emerald-100", iconColor: "text-emerald-700" },
  "kitchen-dining": { icon: CookingPot, tint: "bg-orange-100", iconColor: "text-orange-700" },
  beauty: { icon: Sparkles, tint: "bg-pink-100", iconColor: "text-pink-600" },
  sports: { icon: Trophy, tint: "bg-sky-100", iconColor: "text-sky-700" },
  toys: { icon: ToyBrick, tint: "bg-yellow-100", iconColor: "text-yellow-700" },
  books: { icon: BookOpen, tint: "bg-rose-100", iconColor: "text-rose-700" },
  automotive: { icon: Car, tint: "bg-red-100", iconColor: "text-red-600" },
  gaming: { icon: Gamepad2, tint: "bg-indigo-100", iconColor: "text-indigo-700" },
  fitness: { icon: Dumbbell, tint: "bg-teal-100", iconColor: "text-teal-700" },
}

const FALLBACK: CategoryMeta = { icon: Package, tint: "bg-neutral-100", iconColor: "text-neutral-700" }

export const categoryMeta = (slug: string): CategoryMeta => META[slug] ?? FALLBACK
export const categoryIcon = (slug: string): LucideIcon => categoryMeta(slug).icon
