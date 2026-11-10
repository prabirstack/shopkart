import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import { productImage } from "@/features/catalog/images"

/**
 * Fills its parent (which must be `relative` with a size). Shows the product photo when one
 * exists, otherwise the icon placeholder. Works in server and client components.
 */
export function ProductArt({ slug, title, icon: Icon, sizes, priority = false, imageClassName = "object-contain p-4", iconClassName = "size-1/3 text-neutral-700", strokeWidth = 1.25, src }: {
  slug: string; title: string; icon: LucideIcon; sizes: string; priority?: boolean
  imageClassName?: string; iconClassName?: string; strokeWidth?: number
  /** Override the image (used by the gallery for extra views). */
  src?: string | null
}) {
  const url = src === undefined ? productImage(slug) : src
  if (url) return <Image src={url} alt={title} fill sizes={sizes} preload={priority} className={imageClassName} />
  return <span className="absolute inset-0 grid place-items-center"><Icon className={iconClassName} strokeWidth={strokeWidth} aria-hidden="true" /></span>
}
