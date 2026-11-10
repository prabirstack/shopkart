"use client"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Headphones, Armchair, Pause, Play, Shirt, type LucideIcon } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import type { HeroSlide } from "@/features/promotions/demo"
import type { HeroBanner } from "@/features/promotions/data"
import { campaignImage } from "@/features/catalog/images"
import { usePrefersReducedMotion } from "./use-reduced-motion"

// Decorative artwork per slide. Text stays in HTML so it scales and is accessible.
const art: { icon: LucideIcon; bg: string }[] = [
  { icon: Headphones, bg: "from-neutral-950 via-red-950 to-red-700" },
  { icon: Armchair, bg: "from-neutral-900 via-amber-950 to-orange-700" },
  { icon: Shirt, bg: "from-neutral-900 via-fuchsia-950 to-pink-700" },
]

/**
 * `banners` are the scheduled, image-led hero banners staff upload in the admin. When there are any, they replace the
 * built-in `slides`; when there are none, the static slides show, so the hero is never empty.
 */
export function HeroCarousel({ slides: staticSlides, banners = [] }: { slides: HeroSlide[]; banners?: HeroBanner[] }) {
  const slides: { id: string; title: string }[] = banners.length > 0 ? banners : staticSlides
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [hold, setHold] = useState(false) // pointer over or focus inside
  const [tabHidden, setTabHidden] = useState(false)
  const reduceMotion = usePrefersReducedMotion()
  // Autoplay is on by default, but never with reduced motion and always stoppable.
  const running = !userPaused && !hold && !tabHidden && !reduceMotion && slides.length > 1

  useEffect(() => {
    if (!api) return
    const update = () => setSelected(api.selectedScrollSnap())
    update()
    api.on("select", update)
    api.on("reInit", update)
    return () => { api.off("select", update); api.off("reInit", update) }
  }, [api])

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden)
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  if (slides.length === 0) return null
  const arrow = "absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50 focus-visible:ring-[3px] focus-visible:ring-white/70"

  return (
    <section aria-label="Featured promotions" className="relative"
      onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
      <Carousel setApi={setApi} opts={{ loop: slides.length > 1 }} aria-label="Promotional slides">
        <CarouselContent className="ml-0">
          {banners.length > 0 ? banners.map((b, i) => (
            <CarouselItem key={b.id} className="pl-0" aria-hidden={i !== selected} inert={i !== selected}>
              {/* The artwork fills the frame; the headline and button are real text over a soft gradient, so they stay readable and translatable. */}
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-neutral-900 text-white sm:aspect-[2/1] md:aspect-[8/3]">
                <Image src={b.image.url} alt={b.image.alt} fill priority={i === 0} sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
                <div className="absolute inset-0 z-10 flex flex-col items-start justify-center gap-2 px-14 sm:gap-3 sm:px-16">
                  <h2 className="store-title max-w-md">{b.title}</h2>
                  <Link href={b.href} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-white/60 sm:h-10 sm:px-5">
                    Shop now <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </CarouselItem>
          )) : staticSlides.map((slide, i) => {
            const { icon: Icon, bg } = art[i % art.length]
            return (
              <CarouselItem key={slide.id} className="pl-0" aria-hidden={i !== selected} inert={i !== selected}>
                <div className={`relative grid min-h-64 overflow-hidden rounded-2xl bg-gradient-to-br ${bg} text-white sm:min-h-80 md:min-h-[21rem] md:grid-cols-2`}>
                  <div className="z-10 flex flex-col items-start justify-center gap-3 px-14 py-6 sm:px-16 sm:py-10">
                    <span className="rounded-md bg-primary px-3 py-1 text-xs font-semibold sm:text-sm">{slide.eyebrow}</span>
                    <h2 className="store-title">{slide.title}</h2>
                    <p className="max-w-xs text-sm text-white/90 sm:text-base">{slide.description}</p>
                    <Link href={slide.href} className="mt-1 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-white/60">
                      {slide.action} <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 grid w-3/5 place-items-center opacity-30 md:static md:w-auto md:opacity-100" aria-hidden="true">
                    <div className="absolute size-72 rounded-full bg-red-500/30 blur-3xl" />
                    {campaignImage(slide.id) ? <Image src={campaignImage(slide.id)!} alt="" fill priority={i === 0} sizes="(max-width: 768px) 60vw, 40vw" className="object-contain p-4" /> : <Icon className="relative size-40 text-white/90 md:size-56" strokeWidth={0.9} />}
                  </div>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
      {slides.length > 1 && (
        <>
          <button type="button" aria-label="Previous slide" className={`${arrow} left-3`} onClick={() => api?.scrollPrev()}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next slide" className={`${arrow} right-3`} onClick={() => api?.scrollNext()}>
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/40 py-1.5 pl-1.5 pr-4 shadow-lg backdrop-blur-md">
            <button type="button" aria-label={userPaused || reduceMotion ? "Play slideshow" : "Pause slideshow"} disabled={reduceMotion}
              onClick={() => setUserPaused((v) => !v)}
              className="grid size-8 place-items-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/35 focus-visible:ring-[3px] focus-visible:ring-white/70 disabled:opacity-40">
              {userPaused || reduceMotion ? <Play className="size-3.5 translate-x-px fill-current" aria-hidden="true" /> : <Pause className="size-3.5 fill-current" aria-hidden="true" />}
            </button>
            <div className="flex items-center gap-1.5" role="group" aria-label="Choose a slide">
              {slides.map((slide, i) => {
                const on = selected === i
                return (
                  <button key={slide.id} type="button" onClick={() => api?.scrollTo(i)}
                    aria-label={`Show slide ${i + 1}: ${slide.title}`} aria-current={on}
                    className="group grid h-6 place-items-center focus-visible:outline-none">
                    <span className={`relative block h-2 overflow-hidden rounded-full transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-white ${on ? "w-9 bg-white/35" : "w-2 bg-white/55 group-hover:bg-white/90"}`}>
                      {on && (
                        <span key={`${selected}-${running}`} className="absolute inset-y-0 left-0 block rounded-full bg-white"
                          style={!reduceMotion && slides.length > 1
                            ? { animation: "hero-progress 6s linear forwards", animationPlayState: running ? "running" : "paused" }
                            : { width: "100%" }}
                          onAnimationEnd={() => api?.scrollNext()} />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            <span aria-hidden="true" className="price text-xs font-medium text-white/85">{selected + 1} / {slides.length}</span>
          </div>
        </>
      )}
      <p className="sr-only" aria-live={running ? "off" : "polite"}>Slide {selected + 1} of {slides.length}</p>
    </section>
  )
}
