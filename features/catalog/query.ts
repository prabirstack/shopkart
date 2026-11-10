import { catalog, discountPercent, type Product } from "./demo"
import { toCents } from "@/lib/money"

export const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "discount", label: "Biggest discount" },
] as const
export type Sort = (typeof SORTS)[number]["value"]

export const PAGE_SIZE = 8

export type ShopParams = {
  q: string
  category: string
  brands: string[]
  minPaise: number | null
  maxPaise: number | null
  inStock: boolean
  sort: Sort
  page: number
}

type RawParams = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : [])
const rupeesToPaise = (v: string) => {
  const n = Number(v)
  return v !== "" && Number.isFinite(n) && n >= 0 ? toCents(n) : null
}

/** Validates every URL value; unknown or malformed input falls back to a safe default. */
export function parseShopParams(sp: RawParams): ShopParams {
  const sort = SORTS.find((s) => s.value === one(sp.sort))?.value ?? "relevance"
  const page = Math.max(1, Math.floor(Number(one(sp.page))) || 1)
  return {
    q: one(sp.q).trim().slice(0, 100),
    category: one(sp.category),
    brands: many(sp.brand).slice(0, 10),
    minPaise: rupeesToPaise(one(sp.min)),
    maxPaise: rupeesToPaise(one(sp.max)),
    inStock: one(sp.stock) === "1",
    sort,
    page,
  }
}

/** Builds a /products URL from params, dropping defaults so URLs stay short. */
export function shopHref(p: Partial<ShopParams>, base = "/products") {
  const u = new URLSearchParams()
  if (p.q) u.set("q", p.q)
  if (p.category) u.set("category", p.category)
  p.brands?.forEach((b) => u.append("brand", b))
  if (p.minPaise != null) u.set("min", String(p.minPaise / 100))
  if (p.maxPaise != null) u.set("max", String(p.maxPaise / 100))
  if (p.inStock) u.set("stock", "1")
  if (p.sort && p.sort !== "relevance") u.set("sort", p.sort)
  if (p.page && p.page > 1) u.set("page", String(p.page))
  const qs = u.toString()
  return qs ? `${base}?${qs}` : base
}

export function runShopQuery(p: ShopParams) {
  const q = p.q.toLowerCase()
  const matches = catalog.filter((x) =>
    (q === "" || `${x.title} ${x.brand} ${x.category}`.toLowerCase().includes(q)) &&
    (p.category === "" || x.category === p.category) &&
    (p.brands.length === 0 || p.brands.includes(x.brand)) &&
    (p.minPaise === null || x.pricePaise >= p.minPaise) &&
    (p.maxPaise === null || x.pricePaise <= p.maxPaise) &&
    (!p.inStock || x.stock > 0))

  const sorted: Product[] = [...matches]
  if (p.sort === "price-asc") sorted.sort((a, b) => a.pricePaise - b.pricePaise)
  if (p.sort === "price-desc") sorted.sort((a, b) => b.pricePaise - a.pricePaise)
  if (p.sort === "rating") sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  if (p.sort === "discount") sorted.sort((a, b) => discountPercent(b) - discountPercent(a))

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const page = Math.min(p.page, pages)
  return { total: sorted.length, pages, page, items: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) }
}
