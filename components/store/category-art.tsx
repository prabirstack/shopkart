import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import { categoryImage } from "@/features/catalog/images"

/** Category tile artwork: photo when available, otherwise the tinted icon. Parent must be `relative`. */
export function CategoryArt({ slug, name, icon: Icon, iconColor, sizes, iconClassName = "size-10" }: {
  slug: string; name: string; icon: LucideIcon; iconColor: string; sizes: string; iconClassName?: string
}) {
  const url = categoryImage(slug)
  if (url) return <Image src={url} alt="" fill sizes={sizes} className="object-contain" aria-label={name} />
  return <span className="absolute inset-0 grid place-items-center"><Icon className={`${iconClassName} ${iconColor}`} strokeWidth={1.3} aria-hidden="true" /></span>
}
