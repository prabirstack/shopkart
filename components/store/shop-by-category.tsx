import Link from "next/link"
import { SectionHeader } from "./section-header"
import { categoryMeta } from "@/features/catalog/category-meta"
import { getCategories } from "@/features/catalog/data"
import { CategoryArt } from "./category-art"
import { CategoryCarousel } from "./category-carousel"

export async function ShopByCategory() {
  const categories = await getCategories()
  const items = categories.map((category) => {
    const meta = categoryMeta(category.slug)
    return { id: category.slug, content: <Link href={`/categories/${category.slug}`} className={`group/tile flex h-full min-h-28 flex-col items-center justify-between gap-2 rounded-xl p-3 text-center text-sm font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 ${meta.tint}`}><span className="relative block h-16 w-full overflow-hidden rounded-lg"><CategoryArt slug={category.slug} name={category.name} icon={meta.icon} iconColor={meta.iconColor} sizes="160px" iconClassName="size-14" /></span>{category.name}</Link> }
  })
  return <section aria-labelledby="shop-category-heading"><SectionHeader id="shop-category-heading" title="Shop by Category" href="/categories" linkLabel="View All Categories" /><CategoryCarousel label="Shop by category" items={items} large /></section>
}
