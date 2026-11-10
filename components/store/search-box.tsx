"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useId, useMemo, useRef, useState } from "react"
import { Clock, Search, Tag, TrendingUp } from "lucide-react"
import { suggest } from "@/features/catalog/search"
import { formatMoney } from "@/lib/money"

const RECENT_KEY = "shopkart-recent-searches"
const readRecents = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 5) } catch { return [] }
}
const saveRecent = (q: string) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...readRecents().filter((r) => r !== q)].slice(0, 5))) } catch { /* storage blocked */ }
}

type Option = { id: string; href: string; label: string; hint?: string; kind: "recent" | "product" | "category" | "brand" | "query" }
const iconFor = { recent: Clock, product: Search, category: Tag, brand: TrendingUp, query: Search } as const

export function SearchBox() {
  const router = useRouter()
  const listId = useId()
  const root = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [recents, setRecents] = useState<string[]>([])

  const options: Option[] = useMemo(() => {
    const q = value.trim()
    if (q === "") return recents.map((r) => ({ id: `r-${r}`, href: `/products?q=${encodeURIComponent(r)}`, label: r, kind: "recent" as const }))
    const s = suggest(q)
    return [
      ...s.products.map((p) => ({ id: `p-${p.id}`, href: `/products/${p.slug}`, label: p.title, hint: formatMoney(p.pricePaise, undefined, undefined, { hideZeroDecimals: true }), kind: "product" as const })),
      ...s.categories.map((c) => ({ id: `c-${c.slug}`, href: `/products?category=${c.slug}`, label: c.name, hint: "Category", kind: "category" as const })),
      ...s.brands.map((b) => ({ id: `b-${b}`, href: `/products?brand=${encodeURIComponent(b)}`, label: b, hint: "Brand", kind: "brand" as const })),
      { id: "q", href: `/products?q=${encodeURIComponent(q)}`, label: `Search for “${q}”`, kind: "query" as const },
    ]
  }, [value, recents])

  const go = (o: Option) => {
    if (o.kind === "recent" || o.kind === "query") saveRecent(o.kind === "query" ? value.trim() : o.label)
    setOpen(false)
    router.push(o.href)
  }

  return (
    <div ref={root} className="relative min-w-0 lg:flex-1"
      onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <form action="/products" method="get" role="search"
        onSubmit={(e) => {
          const q = value.trim()
          if (active >= 0 && options[active]) { e.preventDefault(); go(options[active]); return }
          if (q) saveRecent(q)
        }}
        className="flex min-w-0 overflow-hidden rounded-lg border bg-background focus-within:ring-[3px] focus-within:ring-ring/40">
        <label htmlFor="site-search" className="sr-only">Search products</label>
        <input id="site-search" name="q" type="search" maxLength={100} autoComplete="off" value={value}
          role="combobox" aria-expanded={open && options.length > 0} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder="Search for products, brands and more..."
          onFocus={() => { setRecents(readRecents()); setOpen(true) }}
          onChange={(e) => { setValue(e.target.value); setActive(-1); setOpen(true) }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % Math.max(options.length, 1)) }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? options.length - 1 : a - 1)) }
            else if (e.key === "Escape") { setOpen(false); setActive(-1) }
          }}
          className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground" />
        <button type="submit" aria-label="Search" className="grid w-14 place-items-center bg-primary text-primary-foreground hover:bg-primary/90">
          <Search className="size-5" aria-hidden="true" />
        </button>
      </form>
      {open && options.length > 0 && (
        <ul id={listId} role="listbox" aria-label={value ? "Search suggestions" : "Recent searches"}
          className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-popover py-1 shadow-lg">
          {value === "" && <li role="presentation" className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent searches</li>}
          {options.map((o, i) => {
            const Icon = iconFor[o.kind]
            return (
              <li key={o.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <Link href={o.href} onClick={(e) => { e.preventDefault(); go(o) }} onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm ${i === active ? "bg-muted" : ""} ${o.kind === "query" ? "font-medium text-primary" : ""}`}>
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="price shrink-0 text-xs text-muted-foreground">{o.hint}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <p role="status" className="sr-only">{open && value ? `${Math.max(options.length - 1, 0)} suggestions available` : ""}</p>
    </div>
  )
}
