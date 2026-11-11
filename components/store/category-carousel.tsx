"use client"

import { useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"

type Item = { id: string; content: ReactNode }

export function CategoryCarousel({ label, items, large = false }: { label: string; items: Item[]; large?: boolean }) {
  const [api, setApi] = useState<CarouselApi>()
  const button = "grid size-8 shrink-0 place-items-center rounded-full border bg-background text-foreground shadow-sm transition hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
  return (
    <Carousel setApi={setApi} opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }} aria-label={label} className="group/category relative">
      <CarouselContent className="-ml-3 touch-pan-y">
        {items.map((item) => <CarouselItem key={item.id} className={`pl-3 ${large ? "basis-40 sm:basis-44" : "basis-[6.5rem] sm:basis-28"}`}>{item.content}</CarouselItem>)}
      </CarouselContent>
      {items.length > 5 && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 bg-gradient-to-l from-background via-background/90 to-transparent pl-10">
        <button type="button" aria-label={`Previous ${label}`} className={`${button} pointer-events-auto`} onClick={() => api?.scrollPrev()}><ChevronLeft className="size-4" aria-hidden="true" /></button>
        <button type="button" aria-label={`Next ${label}`} className={`${button} pointer-events-auto`} onClick={() => api?.scrollNext()}><ChevronRight className="size-4" aria-hidden="true" /></button>
      </div>}
    </Carousel>
  )
}
