"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ProductArt } from "@/components/store/product-art"
import { Price } from "@/components/price"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { ProductRow } from "@/components/store/product-row"
import { SectionHeader } from "@/components/store/section-header"
import { isUuid } from "./types"
import { useProducts } from "./use-products"

const MAX = 8

type RecentState = {
  /** Product ids, most recently viewed first. */
  ids: string[]
  push: (id: string) => void
}

/** Last products the shopper opened, kept in this browser only. */
export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set) => ({
      ids: [],
      push: (id) => set((s) => (s.ids[0] === id ? s : { ids: [id, ...s.ids.filter((x) => x !== id)].slice(0, MAX) })),
    }),
    { name: "shopkart-recent", storage: createJSONStorage(() => localStorage), skipHydration: true, version: 1, migrate: (state) => ({ ids: (((state ?? {}) as { ids?: string[] }).ids ?? []).filter(isUuid).slice(0, MAX) }) as never },
  ),
)

/** Loads the saved list once, after the first render (the store skips hydration to avoid server/client mismatches). */
function useRecentIds() {
  const ids = useRecentlyViewed((s) => s.ids)
  const [ready, setReady] = useState(false)
  useEffect(() => { void Promise.resolve(useRecentlyViewed.persist.rehydrate()).then(() => setReady(true)) }, [])
  return { ids, ready }
}

/** Render on a product page: remembers that this product was viewed. Renders nothing. */
export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!isUuid(productId)) return
    void Promise.resolve(useRecentlyViewed.persist.rehydrate()).then(() => useRecentlyViewed.getState().push(productId))
  }, [productId])
  return null
}

/** The "Recently Viewed" row. Shown only when the shopper has viewed something that still exists. */
export function RecentlyViewedRow({ exclude, compact = false }: { exclude?: string; compact?: boolean }) {
  const { ids, ready } = useRecentIds()
  const wanted = ids.filter((id) => id !== exclude)
  const { products } = useProducts(ready ? wanted : [])
  if (!ready || products.length === 0) return null
  return (
    <section aria-labelledby="recent-heading">
      <SectionHeader id="recent-heading" title="Recently Viewed" />
      {compact ? <Carousel opts={{ align: "start", containScroll: "trimSnaps" }} aria-label="Recently viewed products"><CarouselContent className="-ml-3 py-1">
        {products.map(product => <CarouselItem key={product.id} className="basis-[85%] pl-3 sm:basis-1/2 lg:basis-1/4"><Link href={`/products/${product.slug}`} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-3 transition-all hover:border-primary/30 hover:shadow-sm">
          <span className="relative h-12 w-16 shrink-0"><ProductArt slug={product.slug} title="" category={product.category} images={product.images} sizes="64px" imageClassName="object-contain p-1" /></span>
          <span className="grid min-w-0 gap-1"><span className="line-clamp-1 text-xs font-medium">{product.title}</span><Price cents={product.pricePaise} priceClassName="text-primary" className="text-xs" /></span>
        </Link></CarouselItem>)}
      </CarouselContent><CarouselPrevious className="-left-3 size-8 bg-white shadow-sm disabled:hidden max-sm:hidden" /><CarouselNext className="-right-3 size-8 bg-white shadow-sm disabled:hidden max-sm:hidden" /></Carousel> : <ProductRow products={products} label="Recently viewed products" />}
    </section>
  )
}
