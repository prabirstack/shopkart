"use client"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Check, GitCompareArrows, Link2, ShoppingCart, Trophy, X } from "lucide-react"
import { Price } from "@/components/price"
import { ProductArt } from "@/components/store/product-art"
import { SectionHeader } from "@/components/store/section-header"
import { Stars } from "@/components/store/stars"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { AddToCartButton } from "@/features/cart/add-to-cart-button"
import { discountPercent, isUuid, type Product } from "@/features/catalog/types"
import { specGroups, warrantyFor } from "@/features/catalog/specs"
import { formatMoney } from "@/lib/money"
import { useCompareProducts } from "./hooks"
import { MAX_COMPARE, useCompare } from "./store"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })
type Row = { label: string; text: (p: Product) => string; node?: (p: Product) => ReactNode; best?: "min" | "max"; value?: (p: Product) => number }

const overview: Row[] = [
  { label: "Price", text: (p) => rupees(p.pricePaise), node: (p) => <Price cents={p.pricePaise} compareAtCents={p.comparePaise} showDiscountLabel={false} priceClassName="text-lg text-primary" />, best: "min", value: (p) => p.pricePaise },
  { label: "Discount", text: (p) => `${discountPercent(p)}%`, node: (p) => (discountPercent(p) ? `${discountPercent(p)}% off` : "None"), best: "max", value: discountPercent },
  { label: "Rating", text: (p) => String(p.rating ?? "–"), node: (p) => (p.rating ? <span className="inline-flex items-center gap-2"><Stars value={p.rating} /><span className="font-medium">{p.rating}</span></span> : "No ratings"), best: "max", value: (p) => p.rating ?? 0 },
  { label: "Reviews", text: (p) => p.reviews ?? "–", node: (p) => p.reviews ?? "–" },
  { label: "Availability", text: (p) => (p.stock === 0 ? "Out of stock" : p.stock <= 10 ? "Low stock" : "In stock"), node: (p) => <span className={p.stock === 0 ? "font-medium text-destructive" : p.stock <= 10 ? "font-medium text-amber-700" : "font-medium text-emerald-700"}>{p.stock === 0 ? "Out of stock" : p.stock <= 10 ? `Only ${p.stock} left` : "In stock"}</span> },
  { label: "GST", text: (p) => `${p.gstPercent}%`, node: (p) => `${p.gstPercent}% included` },
  { label: "Warranty", text: warrantyFor },
]

/** `suggestions` is a server-rendered row of popular products, shown when there is nothing to compare yet. */
export function CompareView({ suggestions }: { suggestions: ReactNode }) {
  const { hydrated, ids, products, loading } = useCompareProducts()
  const setIds = useCompare((s) => s.setIds)
  const remove = useCompare((s) => s.remove)
  const clear = useCompare((s) => s.clear)
  const params = useSearchParams()
  const [diffOnly, setDiffOnly] = useState(false)
  const [copied, setCopied] = useState(false)

  // The address bar always mirrors what is shown, so reloads and shared links match the table.
  // A link opened with ?ids=a,b,c loads that comparison once, after the saved list has loaded.
  const router = useRouter()
  const fromUrl = params.get("ids")
  const applied = useRef(false)
  const pending = useRef<string | null>(null) // ids from the URL that are still being applied
  useEffect(() => {
    if (!hydrated || applied.current) return
    applied.current = true
    const valid = (fromUrl ?? "").split(",").filter(isUuid).slice(0, MAX_COMPARE)
    if (valid.length && valid.join(",") !== useCompare.getState().ids.join(",")) { pending.current = valid.join(","); setIds(valid) }
  }, [hydrated, fromUrl, setIds])
  useEffect(() => {
    if (!hydrated || !applied.current) return
    const current = ids.join(",")
    if (pending.current !== null) { if (current !== pending.current) return; pending.current = null }
    if ((fromUrl ?? "") !== current) router.replace(current ? `/compare?ids=${current}` : "/compare", { scroll: false })
  }, [hydrated, ids, fromUrl, router])

  const groups = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, string>>>() // group -> key -> productId -> value
    products.forEach((p) => specGroups(p).forEach((g) => g.rows.forEach(([k, v]) => { const gm = map.get(g.title) ?? new Map(); const km = gm.get(k) ?? new Map(); km.set(p.id, v); gm.set(k, km); map.set(g.title, gm) })))
    return [...map.entries()].map(([title, keys]) => ({ title, rows: [...keys.entries()].map(([label, vals]) => ({ label, vals })) }))
  }, [products])

  if (!hydrated || (loading && products.length === 0)) return <Skeleton className="h-96 rounded-2xl" />
  if (products.length < 2) return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <div className="grid justify-items-center gap-3 rounded-2xl border bg-card px-6 py-14 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><GitCompareArrows className="size-7" aria-hidden="true" /></span>
        <h2 className="text-xl font-bold">{products.length === 0 ? "Nothing to compare yet" : "Add one more product"}</h2>
        <p className="max-w-md text-muted-foreground">Use the compare icon on any product card, or the &quot;Add to compare&quot; button on a product page. You can compare up to {MAX_COMPARE} at once.</p>
        <Link href="/products" className={buttonVariants() + " mt-2"}>Browse products</Link>
      </div>
      <section aria-labelledby="cmp-suggest"><SectionHeader id="cmp-suggest" title="Popular products to compare" />{suggestions}</section>
    </div>
  )

  const sameCategory = new Set(products.map((p) => p.category)).size === 1
  const best = (row: Row) => { if (!row.best || !row.value) return null; const vals = products.map(row.value); const target = row.best === "min" ? Math.min(...vals) : Math.max(...vals); return vals.filter((v) => v === target).length === products.length || target === 0 ? null : target }
  const differs = (vals: string[]) => new Set(vals).size > 1
  const cols = { gridTemplateColumns: `minmax(8rem,10rem) repeat(${products.length}, minmax(11rem,1fr))` }
  const cell = "border-b px-3 py-3 text-sm"

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={diffOnly} onCheckedChange={setDiffOnly} aria-label="Show only differences" /> Show only differences</label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/compare?ids=${products.map((p) => p.id).join(",")}`); setCopied(true); window.setTimeout(() => setCopied(false), 2000) } catch { /* clipboard blocked */ } }} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted">{copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />}{copied ? "Link copied" : "Copy share link"}</button>
          <button type="button" onClick={clear} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted"><X className="size-4" aria-hidden="true" /> Clear all</button>
        </div>
      </div>
      {!sameCategory && <p role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">These products are from different categories, so some specifications won&apos;t match up.</p>}
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
        <div role="table" aria-label="Product comparison" className="min-w-max">
          <div role="row" style={cols} className="grid">
            <div role="columnheader" className="sticky left-0 z-10 border-b bg-card px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</div>
            {products.map((p) => (
              <div key={p.id} role="columnheader" className="relative grid content-start gap-2 border-b border-l p-4">
                <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.title}`} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" aria-hidden="true" /></button>
                <Link href={`/products/${p.slug}`} className="relative block aspect-square w-28 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-200"><ProductArt slug={p.slug} title={p.title} category={p.category} sizes="112px" imageClassName="object-contain p-2" /></Link>
                <p className="text-xs text-muted-foreground">{p.brand}</p>
                <Link href={`/products/${p.slug}`} className="line-clamp-2 font-semibold hover:text-primary">{p.title}</Link>
                <AddToCartButton productId={p.id} product={p} disabled={p.stock === 0} className="mt-1 h-9 w-full" label="Add to cart" />
              </div>
            ))}
          </div>
          <SectionRow title="Overview" cols={cols} />
          {overview.map((row) => {
            const vals = products.map(row.text); const isDiff = differs(vals); const target = best(row)
            if (diffOnly && !isDiff) return null
            return (
              <div key={row.label} role="row" style={cols} className="grid">
                <div role="rowheader" className={`${cell} sticky left-0 z-10 bg-card font-medium text-muted-foreground`}>{row.label}</div>
                {products.map((p) => { const win = target !== null && row.value && row.value(p) === target; return (
                  <div key={p.id} role="cell" className={`${cell} border-l ${isDiff ? "bg-amber-50/60" : ""}`}>
                    <span className="inline-flex flex-wrap items-center gap-2">{row.node ? row.node(p) : row.text(p)}{win && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800"><Trophy className="size-3" aria-hidden="true" />Best</span>}</span>
                  </div>) })}
              </div>
            )
          })}
          {groups.map((g) => {
            const rows = g.rows.filter((r) => !diffOnly || differs(products.map((p) => r.vals.get(p.id) ?? "–")))
            if (rows.length === 0) return null
            return (
              <div key={g.title} role="rowgroup">
                <SectionRow title={g.title} cols={cols} />
                {rows.map((r) => { const vals = products.map((p) => r.vals.get(p.id) ?? "–"); const isDiff = differs(vals); return (
                  <div key={r.label} role="row" style={cols} className="grid">
                    <div role="rowheader" className={`${cell} sticky left-0 z-10 bg-card font-medium text-muted-foreground`}>{r.label}</div>
                    {vals.map((v, i) => <div key={products[i].id} role="cell" className={`${cell} border-l ${isDiff ? "bg-amber-50/60" : ""} ${v === "–" ? "text-muted-foreground" : ""}`}>{v}</div>)}
                  </div>) })}
              </div>
            )
          })}
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded bg-amber-100" /> Rows that differ</span><span className="flex items-center gap-1.5"><ShoppingCart className="size-3" aria-hidden="true" /> Specifications are sample data for the demo store.</span></p>
    </div>
  )
}

function SectionRow({ title, cols }: { title: string; cols: React.CSSProperties }) {
  return <div role="row" style={cols} className="grid bg-muted/50"><div role="columnheader" className="sticky left-0 z-10 col-span-full border-b bg-muted/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</div></div>
}
