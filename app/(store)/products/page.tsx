import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ChevronLeft, ChevronRight, PackageSearch, X } from "lucide-react"
import { FilterSheet } from "@/components/store/filter-sheet"
import { ProductCard } from "@/components/store/product-card"
import { ShopFilters } from "@/components/store/shop-filters"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { categoryMeta } from "@/features/catalog/category-meta"
import { getCategories, getDidYouMean, getShopResults } from "@/features/catalog/data"
import { PAGE_SIZE, SORTS, parseShopParams, shopHref, type ShopParams } from "@/features/catalog/query"
import { formatMoney } from "@/lib/money"
import { absoluteUrl } from "@/lib/site"
import { FREE_DELIVERY_ABOVE_PAISE } from "@/lib/store-config"

export const metadata: Metadata = { title: "Shop all products", description: "Browse electronics, fashion, home and kitchen products. Filter by brand, price and rating." }

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

function activeChips(p: ShopParams, categoryName?: string) {
  const chips: { label: string; href: string }[] = []
  if (p.q) chips.push({ label: `“${p.q}”`, href: shopHref({ ...p, q: "", page: 1 }) })
  if (p.category) chips.push({ label: categoryName ?? p.category, href: shopHref({ ...p, category: "", page: 1 }) })
  p.brands.forEach((b) => chips.push({ label: b, href: shopHref({ ...p, brands: p.brands.filter((x) => x !== b), page: 1 }) }))
  if (p.minPaise != null) chips.push({ label: `Min ${rupees(p.minPaise)}`, href: shopHref({ ...p, minPaise: null, page: 1 }) })
  if (p.maxPaise != null) chips.push({ label: `Max ${rupees(p.maxPaise)}`, href: shopHref({ ...p, maxPaise: null, page: 1 }) })
  if (p.inStock) chips.push({ label: "In stock", href: shopHref({ ...p, inStock: false, page: 1 }) })
  if (p.rating) chips.push({ label: `${p.rating}★ & up`, href: shopHref({ ...p, rating: 0, page: 1 }) })
  if (p.discount) chips.push({ label: `${p.discount}%+ off`, href: shopHref({ ...p, discount: 0, page: 1 }) })
  return chips
}

async function ShopResults({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  const params = parseShopParams(await searchParams)
  const [{ items, total, pages, page }, categories] = await Promise.all([getShopResults(params, PAGE_SIZE), getCategories()])
  const suggestion = params.q && total === 0 ? await getDidYouMean(params.q) : null
  const category = categories.find((c) => c.slug === params.category)
  const categoryName = category?.name
  const chips = activeChips(params, categoryName)
  const look = category ? categoryMeta(category.slug) : null
  const title = params.q ? `Results for “${params.q}”` : categoryName ?? "All products"
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const last = Math.min(page * PAGE_SIZE, total)

  // Indexable: the plain shop and single-category pages. Everything else is a thin or duplicate view.
  const indexable = !params.q && params.brands.length === 0 && params.minPaise === null && params.maxPaise === null && !params.inStock && !params.rating && !params.discount && params.sort === "relevance" && params.page === 1
  const canonical = absoluteUrl(params.category ? `/products?category=${params.category}` : "/products")
  return (
    <>
      <link rel="canonical" href={canonical} />
      {!indexable && <meta name="robots" content="noindex, follow" />}
      <StoreBreadcrumbs trail={categoryName ? [{ label: "Shop", href: "/products" }, { label: categoryName }] : [{ label: "Shop" }]} />
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-4 rounded-xl border bg-card p-4"><ShopFilters params={params} idPrefix="d" /></div>
        </aside>
        <div className="grid min-w-0 content-start gap-4">
          {category && look && (
            <div className={`group relative isolate flex min-h-32 items-center justify-between gap-5 overflow-hidden rounded-2xl border border-black/5 p-5 shadow-sm sm:px-7 ${look.tint}`}>
              <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-16 -z-10 size-56 rounded-full border-[28px] border-white/30 transition-transform duration-500 group-hover:scale-110" />
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 sm:size-16">
                  <look.icon className={`size-8 ${look.iconColor}`} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/55">Explore the collection</p>
                  <p className="mt-1 text-pretty text-base font-semibold leading-snug text-foreground sm:text-lg">Browse our {category.name.toLowerCase()} range</p>
                  <p className="mt-1 text-xs text-foreground/65 sm:text-sm">Curated picks for everyday living.</p>
                </div>
              </div>
              <span className="hidden shrink-0 items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-semibold text-foreground shadow-sm sm:inline-flex">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />Free delivery above {rupees(FREE_DELIVERY_ABOVE_PAISE)}
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="store-title !text-3xl">{title}</h1>
              <p role="status" className="mt-1 text-sm text-muted-foreground">
                {total === 0 ? "No products found" : `Showing ${first}–${last} of ${total} products`}
              </p>
            </div>
            <FilterSheet activeCount={chips.length}><ShopFilters params={params} idPrefix="m" /></FilterSheet>
          </div>
          <nav aria-label="Sort products" className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort by</span>
            {SORTS.map((s) => (
              <Link key={s.value} href={shopHref({ ...params, sort: s.value, page: 1 })} aria-current={params.sort === s.value ? "true" : undefined}
                className={`rounded-full border px-3 py-1 ${params.sort === s.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{s.label}</Link>
            ))}
          </nav>
          {chips.length > 0 && (
            <ul aria-label="Active filters" className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/70">
                    {c.label} <X className="size-3" aria-hidden="true" /><span className="sr-only">Remove filter</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {suggestion && (
            <p className="rounded-lg bg-muted px-4 py-3 text-sm">
              Did you mean <Link href={shopHref({ ...params, q: suggestion, page: 1 })} className="font-semibold text-primary underline-offset-4 hover:underline">{suggestion}</Link>?
            </p>
          )}
          {items.length === 0 ? (
            <Empty className="rounded-xl border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><PackageSearch aria-hidden="true" /></EmptyMedia>
                <EmptyTitle>No products match your filters</EmptyTitle>
                <EmptyDescription>Try removing a filter or searching for something broader.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent><Link href="/products" className={buttonVariants({ variant: "outline" })}>Clear all filters</Link></EmptyContent>
            </Empty>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
            </ul>
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t pt-5 text-sm">
              {page > 1 && <Link href={shopHref({ ...params, page: page - 1 })} rel="prev" className="inline-flex h-10 items-center gap-1 rounded-full border bg-background px-4 font-medium transition hover:border-primary hover:text-primary"><ChevronLeft className="size-4" aria-hidden="true" /> Previous</Link>}
              <div className="flex items-center gap-1" aria-label={`Page ${page} of ${pages}`}>
                {Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1).map((n, i, visible) => (
                  <span key={n} className="contents">
                    {i > 0 && n - visible[i - 1] > 1 && <span aria-hidden="true" className="px-1 text-muted-foreground">…</span>}
                    <Link href={shopHref({ ...params, page: n })} aria-current={n === page ? "page" : undefined} aria-label={`Page ${n}`} className={`grid size-10 place-items-center rounded-full border font-medium transition ${n === page ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-background hover:border-primary hover:text-primary"}`}>{n}</Link>
                  </span>
                ))}
              </div>
              {page < pages && <Link href={shopHref({ ...params, page: page + 1 })} rel="next" className="inline-flex h-10 items-center gap-1 rounded-full border bg-background px-4 font-medium transition hover:border-primary hover:text-primary">Next <ChevronRight className="size-4" aria-hidden="true" /></Link>}
              <span className="sr-only" aria-live="polite">Page {page} of {pages}. Showing {first} to {last} of {total} products.</span>
            </nav>
          )}
        </div>
      </div>
    </>
  )
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-4 py-6">
      <Suspense fallback={<Skeleton className="h-[40rem] w-full rounded-xl" />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
