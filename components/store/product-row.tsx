import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import type { Product } from "@/features/catalog/types"
import { ProductCard } from "./product-card"

const arrow = "z-10 size-9 border-0 bg-background shadow-md hover:bg-muted"

/** Swipeable, keyboard-friendly row. Arrows disable at the ends; cards snap into place. */
export function ProductRow({ products, label }: { products: Product[]; label: string }) {
  return (
    <Carousel opts={{ align: "start", dragFree: false, containScroll: "trimSnaps", slidesToScroll: "auto" }}
      aria-label={label} className="group/row">
      <CarouselContent className="-ml-3 pb-1">
        {products.map((p) => (
          <CarouselItem key={p.id} className="basis-[10.5rem] pl-3 sm:basis-48 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
            <ProductCard product={p} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className={`${arrow} left-2 opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 disabled:hidden max-sm:hidden`} />
      <CarouselNext className={`${arrow} right-2 opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 disabled:hidden max-sm:hidden`} />
    </Carousel>
  )
}
