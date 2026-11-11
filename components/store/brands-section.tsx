import Link from "next/link"
import Image from "next/image"
import { SectionHeader } from "./section-header"
import { getBrands } from "@/features/catalog/data"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

import { brandLogos as logos } from "@/features/catalog/brand-logos"

export async function BrandsSection() {
  const brands = (await getBrands()).filter((b) => b.count > 0 && logos[b.name])
  return (
    <section aria-labelledby="brands-heading">
      <SectionHeader id="brands-heading" title="Top Brands on ShopKart" href="/brands" linkLabel="View All Brands" />
      <Carousel opts={{ align: "start", loop: brands.length > 6, slidesToScroll: 1 }} aria-label="Shop by brand" className="group/brands">
        <CarouselContent className="-ml-3 py-1">
          {brands.map(({ name }) => (
            <CarouselItem key={name} className="basis-1/2 pl-3 sm:basis-1/4 lg:basis-1/6">
              <Link href={`/products?brand=${encodeURIComponent(name)}`} aria-label={`Shop ${name}`} className="brand-tile flex h-20 items-center justify-center rounded-xl border border-slate-200/80 bg-white px-7 transition-all hover:border-primary/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary">
                <span className={`relative block w-full ${name === "Apple" || name === "Adidas" ? "h-9" : "h-6"}`}><Image src={`/images/brands/${logos[name]}.webp`} alt={name} fill sizes="(max-width: 640px) 120px, 160px" className="object-contain" /></span>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-3 size-8 border-slate-200 bg-white shadow-sm disabled:hidden max-sm:hidden" />
        <CarouselNext className="-right-3 size-8 border-slate-200 bg-white shadow-sm disabled:hidden max-sm:hidden" />
      </Carousel>
    </section>
  )
}
