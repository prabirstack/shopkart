import { brands, bestsellers, catalog, categories, newArrivals, type Category, type Product } from "./demo"

/** Everything the header mega menus show, derived from the catalog so counts never go stale. */

export type CountedCategory = Category & { count: number }

const countBy = (list: Product[]): CountedCategory[] =>
  categories
    .map((c) => ({ ...c, count: list.filter((p) => p.category === c.slug).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

const reviewCount = (p: Product) => {
  const n = Number((p.reviews ?? "0").replace(/[^0-9.]/g, ""))
  return p.reviews?.includes("K") ? n * 1000 : n
}

export const newArrivalCategories = countBy(newArrivals)
export const bestsellerCategories = countBy(bestsellers)
export const justIn: Product[] = newArrivals.slice(0, 3)
export const topRated: Product[] = [...bestsellers].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || reviewCount(b) - reviewCount(a)).slice(0, 3)

export type BrandStat = { name: string; count: number; topCategory: string }
export const brandStats: BrandStat[] = brands
  .map((name) => {
    const items = catalog.filter((p) => p.brand === name)
    const best = categories.map((c) => ({ c, n: items.filter((p) => p.category === c.slug).length })).sort((a, b) => b.n - a.n)[0]
    return { name, count: items.length, topCategory: best?.n ? best.c.short : "" }
  })
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

/** Brands grouped under their first letter for the A to Z index. */
export const brandIndex: { letter: string; brands: BrandStat[] }[] = Object.entries(
  brandStats.reduce<Record<string, BrandStat[]>>((acc, b) => { (acc[b.name[0].toUpperCase()] ??= []).push(b); return acc }, {}),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([letter, list]) => ({ letter, brands: list.sort((a, b) => a.name.localeCompare(b.name)) }))

export const menuTotals = { newArrivals: newArrivals.length, bestsellers: bestsellers.length, brands: brands.length }
