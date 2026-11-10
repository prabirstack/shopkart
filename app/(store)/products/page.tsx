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
import { categories } from "@/features/catalog/demo"
import { PAGE_SIZE, SORTS, parseShopParams, runShopQuery, shopHref, type ShopParams } from "@/features/catalog/query"
import { formatMoney } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE } from "@/lib/store-config"

export const metadata: Metadata = { title: "Shop all products | ShopKart" }

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

function activeChips(p: ShopParams) {
  const chips: { label: string; href: string }[] = []
  if (p.q) chips.push({ label: `“${p.q}”`, href: shopHref({ ...p, q: "", page: 1 }) })
  if (p.category) chips.push({ label: categories.find((c) => c.slug === p.category)?.name ?? p.category, href: shopHref({ ...p, category: "", page: 1 }) })
  p.brands.forEach((b) => chips.push({ label: b, href: shopHref({ ...p, brands: p.brands.filter((x) => x !== b), page: 1 }) }))
  if (p.minPaise != null) chips.push({ label: `Min ${rupees(p.minPaise)}`, href: shopHref({ ...p, minPaise: null, page: 1 }) })
  if (p.maxPaise != null) chips.push({ label: `Max ${rupees(p.maxPaise)}`, href: shopHref({ ...p, maxPaise: null, page: 1 }) })
  if (p.inStock) chips.push({ label: "In stock", href: shopHref({ ...p, inStock: false, page: 1 }) })
  return chips
}

async function ShopResults({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  const params = parseShopParams(await searchParams)
  const { items, total, pages, page } = runShopQuery(params)
  const chips = activeChips(params)
  const category = categories.find((c) => c.slug === params.category)
  const categoryName = category?.name
  const title = params.q ? `Results for “${params.q}”` : categoryName ?? "All products"
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const last = Math.min(page * PAGE_SIZE, total)

  return (
    <>
      <StoreBreadcrumbs trail={categoryName ? [{ label: "Shop", href: "/products" }, { label: categoryName }] : [{ label: "Shop" }]} />
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-4 rounded-xl border bg-card p-4"><ShopFilters params={params} idPrefix="d" /></div>
        </aside>
        <div className="grid min-w-0 content-start gap-4">
          {category && (
            <div className={`flex items-center gap-4 rounded-2xl p-5 ${category.tint}`}>
              <category.icon className={`size-12 shrink-0 ${category.iconColor}`} strokeWidth={1.2} aria-hidden="true" />
              <p className="text-sm">Browse our {category.name.toLowerCase()} range. Free delivery above {rupees(FREE_DELIVERY_ABOVE_PAISE)}.</p>
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
            <nav aria-label="Pagination" className="mt-2 flex items-center justify-center gap-3 text-sm">
              {page > 1 ? <Link href={shopHref({ ...params, page: page - 1 })} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 hover:bg-muted"><ChevronLeft className="size-4" aria-hidden="true" /> Previous</Link> : <span />}
              <span className="text-muted-foreground">Page {page} of {pages}</span>
              {page < pages ? <Link href={shopHref({ ...params, page: page + 1 })} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 hover:bg-muted">Next <ChevronRight className="size-4" aria-hidden="true" /></Link> : <span />}
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
