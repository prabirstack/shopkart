import type { Product, StoreCategory } from "./types"

/**
 * Everything the header mega menus show, derived from catalog data passed in (see components/store/site-header.tsx),
 * so counts never go stale. Plain JSON: it is handed from a server component to client menus.
 */

export type MenuCategory = { slug: string; name: string; count: number }
export type MenuBrand = { name: string; count: number }

/** How many new arrivals / bestsellers the menus and their pages consider. */
export const MENU_LIMIT = 12

export type MenuData = {
  newCategories: MenuCategory[]
  bestCategories: MenuCategory[]
  justIn: Product[]
  topRated: Product[]
  brands: MenuBrand[]
  totals: { newArrivals: number; bestsellers: number; brands: number }
}

const countBy = (categories: StoreCategory[], list: Product[]): MenuCategory[] =>
  categories
    .map((c) => ({ slug: c.slug, name: c.name, count: list.filter((p) => p.category === c.slug).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

export function buildMenu(categories: StoreCategory[], brands: { name: string; count: number }[], newArrivals: Product[], bestsellers: Product[]): MenuData {
  const live = brands.filter((b) => b.count > 0)
  return {
    newCategories: countBy(categories, newArrivals),
    bestCategories: countBy(categories, bestsellers),
    justIn: newArrivals.slice(0, 3),
    topRated: [...bestsellers].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.ratingCount - a.ratingCount).slice(0, 3),
    brands: live.map((b) => ({ name: b.name, count: b.count })),
    totals: { newArrivals: newArrivals.length, bestsellers: bestsellers.length, brands: live.length },
  }
}

/** Brands grouped under their first letter for the A to Z index. */
export function brandIndex(brands: MenuBrand[]): { letter: string; brands: MenuBrand[] }[] {
  const groups = brands.reduce<Record<string, MenuBrand[]>>((acc, b) => { (acc[b.name[0].toUpperCase()] ??= []).push(b); return acc }, {})
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, list]) => ({ letter, brands: [...list].sort((a, b) => a.name.localeCompare(b.name)) }))
}
