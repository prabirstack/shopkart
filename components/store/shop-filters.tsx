import Link from "next/link"
import { Button } from "@/components/ui/button"
import { brands, categories } from "@/features/catalog/demo"
import { facetCounts, shopHref, type ShopParams } from "@/features/catalog/query"
import { Star } from "lucide-react"

const field = "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"

/** A plain GET form: filters live in the URL and work before any JavaScript loads. */
export function ShopFilters({ params, idPrefix }: { params: ShopParams; idPrefix: string }) {
  const facets = facetCounts(params)
  return (
    <form action="/products" method="get" className="grid gap-6">
      {params.q && <input type="hidden" name="q" value={params.q} />}
      {params.sort !== "relevance" && <input type="hidden" name="sort" value={params.sort} />}
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold">Category</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="category" value="" defaultChecked={params.category === ""} className="accent-primary" /> All categories
        </label>
        {categories.filter((c) => (facets.categories.get(c.slug) ?? 0) > 0 || params.category === c.slug).map((c) => (
          <label key={c.slug} className="flex items-center gap-2 text-sm">
            <input type="radio" name="category" value={c.slug} defaultChecked={params.category === c.slug} className="accent-primary" />
            <span className="flex-1">{c.name}</span><span className="text-xs text-muted-foreground">{facets.categories.get(c.slug) ?? 0}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold">Brand</legend>
        {brands.filter((b) => (facets.brands.get(b) ?? 0) > 0 || params.brands.includes(b)).map((b) => (
          <label key={b} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="brand" value={b} defaultChecked={params.brands.includes(b)} className="accent-primary" />
            <span className="flex-1">{b}</span><span className="text-xs text-muted-foreground">{facets.brands.get(b) ?? 0}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold">Price (₹)</legend>
        <div className="flex items-center gap-2">
          <label htmlFor={`${idPrefix}-min`} className="sr-only">Minimum price</label>
          <input id={`${idPrefix}-min`} name="min" type="number" min={0} inputMode="numeric" placeholder="Min"
            defaultValue={params.minPaise != null ? params.minPaise / 100 : ""} className={field} />
          <span aria-hidden="true">–</span>
          <label htmlFor={`${idPrefix}-max`} className="sr-only">Maximum price</label>
          <input id={`${idPrefix}-max`} name="max" type="number" min={0} inputMode="numeric" placeholder="Max"
            defaultValue={params.maxPaise != null ? params.maxPaise / 100 : ""} className={field} />
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold">Customer rating</legend>
        {[0, 4.5, 4, 3].map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input type="radio" name="rating" value={r === 0 ? "" : r} defaultChecked={params.rating === r} className="accent-primary" />
            {r === 0 ? "Any rating" : <span className="flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />{r}+ &amp; up</span>}
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold">Discount</legend>
        {[0, 10, 25, 40].map((d) => (
          <label key={d} className="flex items-center gap-2 text-sm">
            <input type="radio" name="discount" value={d === 0 ? "" : d} defaultChecked={params.discount === d} className="accent-primary" />
            {d === 0 ? "Any discount" : `${d}% or more`}
          </label>
        ))}
      </fieldset>
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
