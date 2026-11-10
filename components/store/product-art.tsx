import { createElement } from "react"
import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import { categoryIcon } from "@/features/catalog/category-meta"
import { productPhotos, type ProductImage } from "@/features/catalog/images"

/**
 * Fills its parent (which must be `relative` with a size). Shows the product photo when one
 * exists, otherwise the icon placeholder. Works in server and client components.
 */
export function ProductArt({ slug, title, icon, category, sizes, priority = false, imageClassName = "object-contain p-4", iconClassName = "size-1/3 text-neutral-700", strokeWidth = 1.25, src, images }: {
  slug: string; title: string; /** The placeholder icon: pass the product's category (preferred) or an icon. */ category?: string; icon?: LucideIcon; sizes: string; priority?: boolean
  imageClassName?: string; iconClassName?: string; strokeWidth?: number
  /** Override the image (used by the gallery for extra views). */
  src?: string | null
  /** The product's own photos (`product.images`). Without them the demo files for this slug are used. */
  images?: ProductImage[]
}) {
  const main = productPhotos(slug, images)[0]
  const url = src === undefined ? main?.url : src
  // Decorative uses pass an empty title and stay empty. Otherwise the uploaded description wins over the title.
  const alt = src === undefined && title ? main?.alt || title : title
  if (url) return <Image src={url} alt={alt} fill sizes={sizes} preload={priority} className={imageClassName} />
  return <span className="absolute inset-0 grid place-items-center">{createElement(icon ?? categoryIcon(category ?? ""), { className: iconClassName, strokeWidth, "aria-hidden": true })}</span>
}
