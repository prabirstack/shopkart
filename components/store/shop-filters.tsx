import Link from "next/link"
import { Button } from "@/components/ui/button"
import { brands, categories } from "@/features/catalog/demo"
import { shopHref, type ShopParams } from "@/features/catalog/query"

const field = "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"

/** A plain GET form: filters live in the URL and work before any JavaScript loads. */
export function ShopFilters({ params, idPrefix }: { params: ShopParams; idPrefix: string }) {
  return (
    <form action="/products" method="get" className="grid gap-6">
      {params.q && <input type="hidden" name="q" value={params.q} />}
      {params.sort !== "relevance" && <input type="hidden" name="sort" value={params.sort} />}
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold">Category</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="category" value="" defaultChecked={params.category === ""} className="accent-primary" /> All categories
        </label>
        {categories.map((c) => (
          <label key={c.slug} className="flex items-center gap-2 text-sm">
            <input type="radio" name="category" value={c.slug} defaultChecked={params.category === c.slug} className="accent-primary" /> {c.name}
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold">Brand</legend>
        {brands.map((b) => (
          <label key={b} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="brand" value={b} defaultChecked={params.brands.includes(b)} className="accent-primary" /> {b}
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
