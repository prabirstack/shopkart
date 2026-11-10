import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getBrands, getCategories, getShopFacets } from "@/features/catalog/data"
import { shopHref, type ShopParams } from "@/features/catalog/query"
import { ChevronDown, Star } from "lucide-react"

/** Collapsible filter section. Native <details>, so it works without JavaScript. */
function FilterGroup({ title, open = true, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b pb-4 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        {title}<ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-2 grid gap-2">{children}</div>
    </details>
  )
}

const field = "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"

/** A plain GET form: filters live in the URL and work before any JavaScript loads. */
export async function ShopFilters({ params, idPrefix }: { params: ShopParams; idPrefix: string }) {
  const [facets, categories, allBrands] = await Promise.all([getShopFacets(params), getCategories(), getBrands()])
  const brands = allBrands.map((b) => b.name)
  return (
    <form action="/products" method="get" className="grid gap-4">
      {params.q && <input type="hidden" name="q" value={params.q} />}
      {params.sort !== "relevance" && <input type="hidden" name="sort" value={params.sort} />}
      <FilterGroup title="Category">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="category" value="" defaultChecked={params.category === ""} className="accent-primary" /> All categories
        </label>
        {categories.filter((c) => (facets.categories[c.slug] ?? 0) > 0 || params.category === c.slug).map((c) => (
          <label key={c.slug} className="flex items-center gap-2 text-sm">
            <input type="radio" name="category" value={c.slug} defaultChecked={params.category === c.slug} className="accent-primary" />
            <span className="flex-1">{c.name}</span><span className="text-xs text-muted-foreground">{facets.categories[c.slug] ?? 0}</span>
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Brand">
        {brands.filter((b) => (facets.brands[b] ?? 0) > 0 || params.brands.includes(b)).map((b) => (
          <label key={b} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="brand" value={b} defaultChecked={params.brands.includes(b)} className="accent-primary" />
            <span className="flex-1">{b}</span><span className="text-xs text-muted-foreground">{facets.brands[b] ?? 0}</span>
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Price (₹)">
        <div className="flex items-center gap-2">
          <label htmlFor={`${idPrefix}-min`} className="sr-only">Minimum price</label>
          <input id={`${idPrefix}-min`} name="min" type="number" min={0} inputMode="numeric" placeholder="Min"
            defaultValue={params.minPaise != null ? params.minPaise / 100 : ""} className={field} />
          <span aria-hidden="true">–</span>
          <label htmlFor={`${idPrefix}-max`} className="sr-only">Maximum price</label>
          <input id={`${idPrefix}-max`} name="max" type="number" min={0} inputMode="numeric" placeholder="Max"
            defaultValue={params.maxPaise != null ? params.maxPaise / 100 : ""} className={field} />
        </div>
      </FilterGroup>
      <FilterGroup title="Customer rating" open={params.rating !== 0}>
        {[0, 4.5, 4, 3].map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input type="radio" name="rating" value={r === 0 ? "" : r} defaultChecked={params.rating === r} className="accent-primary" />
            {r === 0 ? "Any rating" : <span className="flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />{r}+ &amp; up</span>}
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Discount" open={params.discount !== 0}>
        {[0, 10, 25, 40].map((d) => (
          <label key={d} className="flex items-center gap-2 text-sm">
            <input type="radio" name="discount" value={d === 0 ? "" : d} defaultChecked={params.discount === d} className="accent-primary" />
            {d === 0 ? "Any discount" : `${d}% or more`}
          </label>
        ))}
      </FilterGroup>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="stock" value="1" defaultChecked={params.inStock} className="accent-primary" /> In stock only
      </label>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Apply filters</Button>
        <Link href={shopHref({ q: params.q })} className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted">Clear</Link>
      </div>
    </form>
  )
}
