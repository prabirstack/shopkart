import "server-only"

import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm"

import { db } from "../index"
import { brands, categories, productImages, products, stockLevels, taxCategories } from "../schema"
import type { ProductDTO, SearchParams, SearchResult } from "./types"

const PAGE_SIZE = 8

// All catalog reads share one projection, so every list and detail page gets the same product shape.
const available = sql<number>`greatest(coalesce(${stockLevels.onHand} - ${stockLevels.reserved}, 0), 0)`
const avgRating = sql<number | null>`case when ${products.ratingCount} > 0 then round(${products.ratingSum}::numeric / ${products.ratingCount}, 1)::float8 end`

const projection = {
  id: products.id, slug: products.slug, sku: products.sku, title: products.title, description: products.description,
  brandName: brands.name, brandSlug: brands.slug, categorySlug: categories.slug, categoryName: categories.name, categoryShort: categories.shortName,
  pricePaise: products.pricePaise, comparePaise: products.comparePaise, gstPercent: taxCategories.ratePercent, badge: products.badge, status: products.status,
  rating: avgRating, ratingCount: products.ratingCount, available, seoTitle: products.seoTitle, seoDescription: products.seoDescription, createdAt: products.createdAt,
}

/** Every catalog query starts here: products joined to category, brand, tax rate and stock. */
function baseSelect<S extends Record<string, unknown>>(fields: S) {
  return db.select(fields as never).from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .innerJoin(brands, eq(brands.id, products.brandId))
    .innerJoin(taxCategories, eq(taxCategories.id, products.taxCategoryId))
    .leftJoin(stockLevels, eq(stockLevels.productId, products.id))
}

async function toDTOs(rows: Record<string, unknown>[]): Promise<ProductDTO[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id as string)
  const imgs = await db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.position))
  return rows.map((r) => ({
    id: r.id as string, slug: r.slug as string, sku: r.sku as string, title: r.title as string, description: r.description as string,
    brand: { name: r.brandName as string, slug: r.brandSlug as string },
    category: { slug: r.categorySlug as string, name: r.categoryName as string, shortName: r.categoryShort as string },
    pricePaise: r.pricePaise as number, comparePaise: (r.comparePaise as number | null) ?? null, gstPercent: Number(r.gstPercent), badge: (r.badge as string | null) ?? null,
    status: r.status as ProductDTO["status"], rating: r.rating === null || r.rating === undefined ? null : Number(r.rating), ratingCount: r.ratingCount as number,
    available: Number(r.available), images: imgs.filter((i) => i.productId === r.id).map((i) => ({ url: i.url, alt: i.alt })),
    seoTitle: r.seoTitle as string, seoDescription: r.seoDescription as string, createdAt: r.createdAt as Date,
  }))
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

/** Builds the WHERE clause for a search. `skip` leaves out the category or brand filter when counting facets. */
function filters(p: SearchParams, skip: ("category" | "brands")[] = []): SQL {
  const c: SQL[] = [eq(products.status, "published")]
  if (p.category && !skip.includes("category")) c.push(eq(categories.slug, p.category))
  if (p.brands?.length && !skip.includes("brands")) c.push(inArray(brands.name, p.brands))
  if (p.minPaise != null) c.push(sql`${products.pricePaise} >= ${p.minPaise}`)
  if (p.maxPaise != null) c.push(sql`${products.pricePaise} <= ${p.maxPaise}`)
  if (p.inStock) c.push(sql`${available} > 0`)
  if (p.rating) c.push(sql`${products.ratingCount} > 0 and ${products.ratingSum}::numeric / ${products.ratingCount} >= ${p.rating}`)
  if (p.discount) c.push(sql`${products.comparePaise} is not null and (${products.comparePaise} - ${products.pricePaise}) * 100 >= ${p.discount} * ${products.comparePaise}`)
  const q = p.q?.trim()
  if (q) {
    const like = `%${escapeLike(q)}%`
    // Exact words first (full-text), then substrings, then typo-tolerant trigram similarity ("earbud", "samsng").
    c.push(sql`(${products.searchVector} @@ websearch_to_tsquery('simple', ${q}) or ${products.title} ilike ${like} or ${brands.name} ilike ${like} or word_similarity(${q}, ${products.title}) > 0.6 or word_similarity(${q}, ${brands.name}) > 0.5)`)
  }
  return and(...c) as SQL
}

/** Filtered, sorted, paginated product search. Full-text matches rank first when a query is given. */
export async function searchProducts(p: SearchParams = {}): Promise<SearchResult> {
  const pageSize = Math.min(Math.max(p.pageSize ?? PAGE_SIZE, 1), 48)
  const where = filters(p)
  const q = p.q?.trim()
  const rank = q ? sql`(ts_rank(${products.searchVector}, websearch_to_tsquery('simple', ${q})) * 2 + word_similarity(${q}, ${products.title}))` : sql`0`
  const order: Record<string, SQL[]> = {
    relevance: q ? [desc(rank), desc(products.ratingCount)] : [desc(products.createdAt)],
    popular: [desc(products.ratingCount), desc(products.createdAt)],
    "price-asc": [asc(products.pricePaise)], "price-desc": [desc(products.pricePaise)],
    rating: [sql`${avgRating} desc nulls last`, desc(products.ratingCount)],
    discount: [sql`((${products.comparePaise} - ${products.pricePaise})::float8 / nullif(${products.comparePaise}, 0)) desc nulls last`],
    newest: [desc(products.createdAt)],
  }
  const [{ total }] = (await baseSelect({ total: sql<number>`count(*)::int` }).where(where)) as unknown as { total: number }[]
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(p.page ?? 1, 1), pages)
  const rows = await baseSelect(projection).where(where).orderBy(...(order[p.sort ?? "relevance"] ?? order.relevance), asc(products.id)).limit(pageSize).offset((page - 1) * pageSize)
  return { items: await toDTOs(rows as Record<string, unknown>[]), total, pages, page }
}

/** How many products each category and brand would show, given every other active filter. */
export async function facetCounts(p: SearchParams = {}) {
  const cats = await baseSelect({ slug: categories.slug, n: sql<number>`count(*)::int` }).where(filters(p, ["category"])).groupBy(categories.slug)
  const bs = await baseSelect({ name: brands.name, n: sql<number>`count(*)::int` }).where(filters(p, ["brands"])).groupBy(brands.name)
  return {
    categories: Object.fromEntries((cats as unknown as { slug: string; n: number }[]).map((r) => [r.slug, r.n])),
    brands: Object.fromEntries((bs as unknown as { name: string; n: number }[]).map((r) => [r.name, r.n])),
  }
}

export async function getProductBySlug(slug: string, opts: { includeUnpublished?: boolean } = {}): Promise<ProductDTO | null> {
  const where = opts.includeUnpublished ? eq(products.slug, slug) : and(eq(products.slug, slug), eq(products.status, "published"))
  const rows = await baseSelect(projection).where(where).limit(1)
  return (await toDTOs(rows as Record<string, unknown>[]))[0] ?? null
}

/** Products in the order the ids were given. Unknown or unpublished ids are skipped. */
export async function getProductsByIds(ids: string[]): Promise<ProductDTO[]> {
  if (ids.length === 0) return []
  const rows = await baseSelect(projection).where(and(inArray(products.id, ids), eq(products.status, "published")))
  const dtos = await toDTOs(rows as Record<string, unknown>[])
  return ids.flatMap((id) => dtos.filter((d) => d.id === id))
}

export async function listCategories() {
  const rows = await db.select({ id: categories.id, slug: categories.slug, name: categories.name, shortName: categories.shortName, sortOrder: categories.sortOrder, count: sql<number>`count(${products.id}) filter (where ${products.status} = 'published')::int` })
    .from(categories).leftJoin(products, eq(products.categoryId, categories.id)).groupBy(categories.id).orderBy(asc(categories.sortOrder), asc(categories.name))
  return rows
}

export async function listBrands() {
  return db.select({ id: brands.id, slug: brands.slug, name: brands.name, count: sql<number>`count(${products.id}) filter (where ${products.status} = 'published')::int` })
    .from(brands).leftJoin(products, eq(products.brandId, brands.id)).groupBy(brands.id).orderBy(sql`count(${products.id}) filter (where ${products.status} = 'published') desc`, asc(brands.name))
}

/** Same category first, topped up with the best-rated products so the row is never half empty. */
export async function relatedProducts(productId: string, limit = 5): Promise<ProductDTO[]> {
  const [self] = await db.select({ categoryId: products.categoryId }).from(products).where(eq(products.id, productId)).limit(1)
  if (!self) return []
  const same = await baseSelect(projection).where(and(eq(products.status, "published"), eq(products.categoryId, self.categoryId), sql`${products.id} <> ${productId}`)).orderBy(sql`${avgRating} desc nulls last`).limit(limit)
  const out = await toDTOs(same as Record<string, unknown>[])
  if (out.length >= limit) return out
  const more = await baseSelect(projection).where(and(eq(products.status, "published"), sql`${products.id} <> ${productId}`, sql`${products.categoryId} <> ${self.categoryId}`)).orderBy(sql`${avgRating} desc nulls last`, desc(products.ratingCount)).limit(limit - out.length)
  return [...out, ...(await toDTOs(more as Record<string, unknown>[]))]
}

export const newArrivals = (limit = 6) => searchProducts({ sort: "newest", pageSize: limit }).then((r) => r.items)
export const dealProducts = (limit = 5) => searchProducts({ discount: 1, sort: "discount", pageSize: limit }).then((r) => r.items)
export async function bestsellers(limit = 6): Promise<ProductDTO[]> {
  const rows = await baseSelect(projection).where(and(eq(products.status, "published"), sql`(${products.badge} = 'Bestseller' or (${products.ratingCount} > 0 and ${products.ratingSum}::numeric / ${products.ratingCount} >= 4.7))`)).orderBy(sql`${avgRating} desc nulls last`, desc(products.ratingCount)).limit(limit)
  return toDTOs(rows as Record<string, unknown>[])
}

/**
 * "Did you mean...?" for a search with no results: the closest product title or brand name, or null when
 * nothing is close enough. Uses trigram similarity, so it copes with typos.
 */
export async function didYouMean(query: string): Promise<string | null> {
  const q = query.trim().toLowerCase()
  if (q.length < 3) return null
  const rows = await db.execute(sql`
    select term, similarity(lower(term), ${q}) as score from (
      select title as term from products where status = 'published'
      union select name as term from brands
    ) t where similarity(lower(term), ${q}) > 0.2 order by score desc limit 1`)
  const row = (rows as unknown as { rows: { term: string }[] }).rows[0]
  return row && row.term.toLowerCase() !== q ? row.term : null
}

/** Quick suggestions for the header search box: matching products plus the categories and brands that match. */
export async function suggestSearch(query: string, limit = 5) {
  const q = query.trim()
  if (q.length < 2) return { products: [] as ProductDTO[], categories: [] as { slug: string; name: string }[], brands: [] as string[] }
  const like = `%${escapeLike(q)}%`
  const [prods, cats, brs] = await Promise.all([
    searchProducts({ q, pageSize: limit }).then((r) => r.items),
    db.select({ slug: categories.slug, name: categories.name }).from(categories).where(sql`${categories.name} ilike ${like} or word_similarity(${q}, ${categories.name}) > 0.5`).limit(3),
    db.select({ name: brands.name }).from(brands).where(sql`${brands.name} ilike ${like} or word_similarity(${q}, ${brands.name}) > 0.5`).limit(3),
  ])
  return { products: prods, categories: cats, brands: brs.map((b) => b.name) }
}
