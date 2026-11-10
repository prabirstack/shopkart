"use client"
import { useEffect, useState } from "react"
import { BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import type { Review } from "@/features/reviews/demo"
import { Stars } from "./stars"

/** Customer reviews as swipeable cards with arrows and dots. */
export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const [snaps, setSnaps] = useState(0)

  useEffect(() => {
    if (!api) return
    const update = () => { setSelected(api.selectedScrollSnap()); setSnaps(api.scrollSnapList().length) }
    update()
    api.on("select", update)
    api.on("reInit", update)
    return () => { api.off("select", update); api.off("reInit", update) }
  }, [api])

  const arrow = "grid size-9 place-items-center rounded-full border bg-card shadow-xs hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <Carousel setApi={setApi} opts={{ align: "start", loop: true, slidesToScroll: 1 }} aria-label="Customer reviews">
        <CarouselContent className="-ml-4">
          {reviews.map((r, i) => (
            <CarouselItem key={r.id} className="basis-full pl-4 xl:basis-1/2" aria-label={`Review ${i + 1} of ${reviews.length}`}>
              <article className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{r.name[0]}</span>
                    <div>
                      <p className="text-sm font-semibold">{r.name}</p>
                      {r.verified && <p className="flex items-center gap-1 text-xs text-emerald-700"><BadgeCheck className="size-3.5" aria-hidden="true" /> Verified purchase</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
                <div className="flex items-center gap-2"><Stars value={r.rating} /><h3 className="text-sm font-semibold">{r.title}</h3></div>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex items-center justify-between gap-4">
        <div role="group" aria-label="Choose review" className="flex gap-1.5">
          {Array.from({ length: snaps }, (_, i) => (
            <button key={i} type="button" aria-label={`Show review ${i + 1}`} aria-current={selected === i} onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 ${selected === i ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous review" className={arrow} onClick={() => api?.scrollPrev()}><ChevronLeft className="size-4" aria-hidden="true" /></button>
          <button type="button" aria-label="Next review" className={arrow} onClick={() => api?.scrollNext()}><ChevronRight className="size-4" aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  )
}
