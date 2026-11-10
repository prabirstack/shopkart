"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { GitCompareArrows, X } from "lucide-react"
import { ProductArt } from "@/components/store/product-art"
import { useCompareProducts } from "./hooks"
import { MAX_COMPARE, useCompare } from "./store"

/** Floating tray listing the products picked for comparison. Hidden on the compare page itself. */
export function CompareBar() {
  const remove = useCompare((s) => s.remove)
  const clear = useCompare((s) => s.clear)
  const { hydrated, ids, products: items } = useCompareProducts()
  const pathname = usePathname()
  if (!hydrated || ids.length === 0 || pathname.startsWith("/compare")) return null
  return (
    <section role="region" aria-label="Products to compare" className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-2xl flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-300 motion-reduce:animate-none sm:pr-20">
      <ul className="flex flex-1 items-center gap-2">
        {Array.from({ length: MAX_COMPARE }, (_, i) => {
          const p = items[i]
          return (
            <li key={i} className="relative">
              {p ? (
                <>
                  <span className="relative block size-12 overflow-hidden rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-200"><ProductArt slug={p.slug} images={p.images} title={p.title} category={p.category} sizes="48px" imageClassName="object-contain p-1" iconClassName="size-1/2 text-neutral-700" /></span>
                  <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.title} from compare`} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background shadow hover:bg-primary"><X className="size-3" aria-hidden="true" /></button>
                </>
              ) : <span aria-hidden="true" className="grid size-12 place-items-center rounded-lg border-2 border-dashed text-xs text-muted-foreground">{i + 1}</span>}
            </li>
          )
        })}
      </ul>
      <p className="hidden text-sm text-muted-foreground sm:block">{items.length} of {MAX_COMPARE} selected</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={clear} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>
        {items.length >= 2
          ? <Link href={`/compare?ids=${items.map((p) => p.id).join(",")}`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><GitCompareArrows className="size-4" aria-hidden="true" /> Compare ({items.length})</Link>
          : <span className="inline-flex h-10 items-center rounded-lg bg-muted px-4 text-sm text-muted-foreground">Add one more</span>}
      </div>
    </section>
  )
}
