"use client"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { Archive, Copy, Eye, MoreHorizontal, Package, PackagePlus, Pencil, RotateCcw, Search, Trash2 } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { ProductArt } from "@/components/store/product-art"
import { buttonVariants } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { productBySlug } from "@/features/catalog/demo"
import { adminApi, failureMessage } from "@/features/admin/api"
import { money } from "@/features/admin/format"
import type { AdminProduct, ProductStatus } from "@/features/admin/types"

const TABS: { value: "all" | ProductStatus; label: string }[] = [{ value: "all", label: "All" }, { value: "published", label: "Published" }, { value: "draft", label: "Draft" }, { value: "archived", label: "Archived" }]
const tone = { published: "good", draft: "warn", archived: "muted" } as const
const field = "h-9 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"

function Thumb({ p }: { p: AdminProduct }) {
  const demo = productBySlug(p.slug)
  return <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-200">{demo ? <ProductArt slug={p.slug} title="" icon={demo.icon} sizes="44px" imageClassName="object-contain p-1" iconClassName="size-1/2 text-neutral-700" /> : <Package className="size-5 text-neutral-500" aria-hidden="true" />}</span>
}

export function ProductsView({ products, categories }: { products: AdminProduct[]; categories: { slug: string; name: string }[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug
  // Every change goes through the permission-checked API, then the server re-loads the list.
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError("")
    try { await fn(); router.refresh() } catch (e) { setError(failureMessage(e)) } finally { setBusy(false) }
  }
  const setProductStatus = (ids: string[], status: ProductStatus) => run(() => adminApi("admin/products/bulk", { method: "POST", body: { ids, action: status === "published" ? "publish" : status === "draft" ? "unpublish" : "archive" } }))
  const deleteProducts = (ids: string[]) => run(() => adminApi("admin/products/bulk", { method: "POST", body: { ids, action: "delete" } }))
  const [q, setQ] = useState(params.get("q") ?? "")
  const [tab, setTab] = useState<"all" | ProductStatus>("all")
  const [category, setCategory] = useState("all")
  const [sort, setSort] = useState("newest")
  const [selected, setSelected] = useState<string[]>([])
  const [confirm, setConfirm] = useState<string[] | null>(null)

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.value, t.value === "all" ? products.length : products.filter((p) => p.status === t.value).length])), [products])
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = products.filter((p) => (tab === "all" || p.status === tab) && (category === "all" || p.category === category) && (term === "" || `${p.title} ${p.sku} ${p.brand}`.toLowerCase().includes(term)))
    const by: Record<string, (a: AdminProduct, b: AdminProduct) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt), "price-asc": (a, b) => a.pricePaise - b.pricePaise, "price-desc": (a, b) => b.pricePaise - a.pricePaise,
      stock: (a, b) => a.stock - a.reserved - (b.stock - b.reserved), name: (a, b) => a.title.localeCompare(b.title),
    }
    return [...list].sort(by[sort])
  }, [products, tab, category, q, sort])

  const allOn = rows.length > 0 && rows.every((r) => selected.includes(r.id))
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const names = (ids: string[]) => products.filter((p) => ids.includes(p.id)).map((p) => p.title).join(", ")
  const duplicate = (p: AdminProduct) => run(async () => {
    const created = await adminApi<{ id: string }>("admin/products", { method: "POST", body: { title: `${p.title} (copy)`, slug: `${p.slug}-copy`, sku: `${p.sku}-COPY`, description: p.description, categorySlug: p.category, brandName: p.brand, gstPercent: p.gstPercent, pricePaise: p.pricePaise, comparePaise: p.comparePaise, status: "draft", seoTitle: p.seoTitle, seoDescription: p.seoDescription, reorderAt: p.reorderAt, initialStock: 0 } })
    router.push(`/admin/products/${created.id}`)
  })

  return (
    <>
      <PageHeader title="Products" description="Create, price and publish what you sell.">
        <Link href="/admin/products/new" className={buttonVariants()}><PackagePlus aria-hidden="true" /> Add product</Link>
      </PageHeader>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}
      <div aria-busy={busy} className={`overflow-hidden rounded-2xl border bg-card shadow-xs transition-opacity ${busy ? "opacity-70" : ""}`}>
        <div role="tablist" aria-label="Product status" className="flex gap-1 overflow-x-auto border-b px-3 pt-2">
          {TABS.map((t) => (
            <button key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => { setTab(t.value); setSelected([]) }}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${tab === t.value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}<span className={`rounded-full px-2 py-0.5 text-xs ${tab === t.value ? "bg-primary/10" : "bg-muted"}`}>{counts[t.value]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative min-w-52 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><label htmlFor="p-search" className="sr-only">Search products</label>
            <input id="p-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, SKU or brand" className={`${field} w-full pl-9`} /></div>
          <label className="sr-only" htmlFor="p-cat">Category</label>
          <select id="p-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={field}><option value="all">All categories</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
          <label className="sr-only" htmlFor="p-sort">Sort</label>
          <select id="p-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={field}><option value="newest">Newest</option><option value="name">Name</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="stock">Lowest stock</option></select>
        </div>
        {selected.length > 0 && (
          <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 border-y bg-primary/5 px-4 py-2 text-sm">
            <strong>{selected.length} selected</strong>
            <button className="rounded-lg border bg-card px-3 py-1 hover:bg-muted" onClick={() => { void setProductStatus(selected, "published"); setSelected([]) }}>Publish</button>
            <button className="rounded-lg border bg-card px-3 py-1 hover:bg-muted" onClick={() => { void setProductStatus(selected, "draft"); setSelected([]) }}>Unpublish</button>
            <button className="rounded-lg border bg-card px-3 py-1 hover:bg-muted" onClick={() => { void setProductStatus(selected, "archived"); setSelected([]) }}>Archive</button>
            <button className="rounded-lg border border-destructive/40 bg-card px-3 py-1 text-destructive hover:bg-destructive/5" onClick={() => setConfirm(selected)}>Delete</button>
            <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <caption className="sr-only">Products</caption>
            <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-4 py-2.5"><input type="checkbox" aria-label="Select all products" checked={allOn} onChange={() => setSelected(allOn ? [] : rows.map((r) => r.id))} className="accent-primary" /></th>
              <th className="px-2 font-medium">Product</th><th className="px-3 font-medium">Category</th><th className="px-3 text-right font-medium">Price</th><th className="px-3 text-right font-medium">GST</th><th className="px-3 text-right font-medium">Available</th><th className="px-3 font-medium">Status</th><th className="w-12 px-3"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
                            {rows.length === 0 && <tr><td colSpan={8} className="py-14 text-center text-muted-foreground">No products match. <button className="font-medium text-primary hover:underline" onClick={() => { setQ(""); setTab("all"); setCategory("all") }}>Clear filters</button></td></tr>}
              {rows.map((p) => {
                const avail = Math.max(p.stock - p.reserved, 0)
                return (
                  <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/30 ${selected.includes(p.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-4"><input type="checkbox" aria-label={`Select ${p.title}`} checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-primary" /></td>
                    <td className="px-2 py-3"><div className="flex min-w-56 items-center gap-3"><Thumb p={p} /><div className="min-w-0"><Link href={`/admin/products/${p.id}`} className="block truncate font-medium hover:text-primary">{p.title}</Link><span className="font-mono text-xs text-muted-foreground">{p.sku}</span></div></div></td>
                    <td className="whitespace-nowrap px-3 text-muted-foreground">{catName(p.category)}</td>
                    <td className="price whitespace-nowrap px-3 text-right"><span className="font-medium">{money(p.pricePaise)}</span>{p.comparePaise && <span className="ml-1.5 text-xs text-muted-foreground line-through">{money(p.comparePaise)}</span>}</td>
                    <td className="price px-3 text-right">{p.gstPercent}%</td>
                    <td className="px-3 text-right"><span className={`price inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${avail === 0 ? "bg-rose-100 text-rose-700" : avail <= p.reorderAt ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{avail === 0 ? "Out of stock" : avail}</span></td>
                    <td className="px-3"><StatusBadge tone={tone[p.status]}>{p.status[0].toUpperCase() + p.status.slice(1)}</StatusBadge></td>
                    <td className="px-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger aria-label={`Actions for ${p.title}`} className="grid size-8 place-items-center rounded-lg hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"><MoreHorizontal className="size-4" aria-hidden="true" /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild><Link href={`/admin/products/${p.id}`}><Pencil aria-hidden="true" /> Edit</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href={`/products/${p.slug}`} target="_blank"><Eye aria-hidden="true" /> View on store</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void duplicate(p)}><Copy aria-hidden="true" /> Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {p.status === "archived" ? <DropdownMenuItem onClick={() => void setProductStatus([p.id], "draft")}><RotateCcw aria-hidden="true" /> Restore</DropdownMenuItem> : <DropdownMenuItem onClick={() => void setProductStatus([p.id], "archived")}><Archive aria-hidden="true" /> Archive</DropdownMenuItem>}
                          <DropdownMenuItem variant="destructive" onClick={() => setConfirm([p.id])}><Trash2 aria-hidden="true" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t px-4 py-3 text-xs text-muted-foreground" role="status">{`Showing ${rows.length} of ${products.length} products`}. Archive instead of deleting products that appear on past orders.</p>
      </div>
      <ConfirmDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)} title={`Delete ${confirm?.length === 1 ? "this product" : `${confirm?.length} products`}?`}
        description={`${confirm ? names(confirm) : ""}. This removes them from the catalog. Past orders keep their own copy of the details.`} confirmLabel="Delete" onConfirm={() => { if (confirm) { void deleteProducts(confirm); setSelected([]) } }} />
    </>
  )
}
