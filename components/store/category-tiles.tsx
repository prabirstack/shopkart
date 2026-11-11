import Link from "next/link"
import { categoryMeta } from "@/features/catalog/category-meta"
import { getCategories } from "@/features/catalog/data"
import { CategoryArt } from "./category-art"
import { CategoryCarousel } from "./category-carousel"

export async function CategoryTiles() {
  const categories = await getCategories()
  return <CategoryCarousel label="Popular categories" items={categories.map((category) => {
    const meta = categoryMeta(category.slug)
    return { id: category.slug, content: <Link href={`/categories/${category.slug}`} className={`group/tile flex h-full min-h-28 flex-col items-center justify-between gap-2 rounded-xl p-3 text-center text-xs font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 ${meta.tint}`}><span className="relative block h-16 w-full overflow-hidden rounded-lg"><CategoryArt slug={category.slug} name={category.name} icon={meta.icon} iconColor={meta.iconColor} sizes="120px" /></span>{category.short}</Link> }
  })} />
}
