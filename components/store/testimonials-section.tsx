"use client"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { testimonials } from "@/features/reviews/demo"
import { SectionHeader } from "./section-header"
import { Stars } from "./stars"

/** Swipeable testimonial carousel: arrows, dots and keyboard arrows (focus the carousel first). */
export function TestimonialsSection() {
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
    <section aria-labelledby="testimonials-heading">
      <SectionHeader id="testimonials-heading" title="What our customers say">
        <span className="hidden text-sm text-muted-foreground sm:inline">Sample testimonials for the demo store</span>
      </SectionHeader>
      <Carousel setApi={setApi} opts={{ align: "start", loop: true }} aria-label="Customer testimonials">
        <CarouselContent className="-ml-4">
          {testimonials.map((t, i) => (
            <CarouselItem key={t.id} className="basis-full pl-4 md:basis-1/2 lg:basis-1/3" aria-label={`Testimonial ${i + 1} of ${testimonials.length}`}>
              <figure className="relative flex h-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                <Quote className="size-8 text-primary/25" aria-hidden="true" />
                <blockquote className="flex-1 text-sm leading-relaxed">{t.quote}</blockquote>
                <figcaption className="flex items-center justify-between gap-3 border-t pt-4">
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{t.name[0]}</span>
                    <span><span className="block text-sm font-semibold">{t.name}</span><span className="text-xs text-muted-foreground">{t.city}</span></span>
                  </span>
                  <Stars value={t.rating} />
                </figcaption>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div role="group" aria-label="Choose testimonial" className="flex gap-1.5">
          {Array.from({ length: snaps }, (_, i) => (
            <button key={i} type="button" aria-label={`Show testimonial ${i + 1}`} aria-current={selected === i} onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 ${selected === i ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous testimonial" className={arrow} onClick={() => api?.scrollPrev()}><ChevronLeft className="size-4" aria-hidden="true" /></button>
          <button type="button" aria-label="Next testimonial" className={arrow} onClick={() => api?.scrollNext()}><ChevronRight className="size-4" aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  )
}
