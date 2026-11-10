"use client"
import { useEffect, useState } from "react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { productById } from "./demo"

/** Swipeable main image kept in sync with the thumbnails. Swap icons for next/image once photos exist. */
export function ProductGallery({ productId, badge }: { productId: string; badge?: string }) {
  // Icons are functions and cannot cross the server/client boundary, so look the product up here.
  const product = productById(productId)!
  const Icon = product.icon
  const views = ["Front", "Side", "Back", "In use"]
  const [api, setApi] = useState<CarouselApi>()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!api) return
    const update = () => setActive(api.selectedScrollSnap())
    update()
    api.on("select", update)
    return () => { api.off("select", update) }
  }, [api])

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Carousel setApi={setApi} opts={{ loop: true }} aria-label={`${product.title} images`}>
          <CarouselContent className="ml-0">
            {views.map((v, i) => (
              <CarouselItem key={v} className="pl-0" aria-hidden={i !== active} inert={i !== active}>
                <div className="grid aspect-square place-items-center rounded-2xl bg-neutral-100">
                  <Icon className="size-1/3 text-neutral-700" strokeWidth={1} aria-hidden="true" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        {badge && <span className="absolute left-4 top-4 rounded-md bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">{badge}</span>}
        <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground">{views[active]} view · {active + 1}/{views.length}</span>
      </div>
      <ul className="grid grid-cols-4 gap-3">
        {views.map((v, i) => (
          <li key={v}>
            <button type="button" onClick={() => api?.scrollTo(i)} aria-label={`Show ${v.toLowerCase()} view of ${product.title}`} aria-pressed={active === i}
              className={`grid aspect-square w-full place-items-center rounded-xl bg-neutral-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 ${active === i ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"}`}>
              <Icon className="size-1/3 text-neutral-500" strokeWidth={1} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
