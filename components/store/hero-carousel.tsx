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

/** Live admin campaigns lead the carousel; complementary evergreen slides keep it browsable. */
export function HeroCarousel({ slides: staticSlides, banners = [] }: { slides: HeroSlide[]; banners?: HeroBanner[] }) {
  const slides = [
    ...banners.map((b) => ({ ...b, eyebrow: "Featured collection", description: "Discover something extraordinary for your everyday.", action: "Shop Now", artwork: b.image.url })),
    ...staticSlides.filter((s) => !banners.some((b) => b.title.toLowerCase() === s.eyebrow.toLowerCase() || b.title.toLowerCase() === s.title.toLowerCase())).map((s) => ({ ...s, artwork: campaignImage(s.id) })),
  ]
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

  useEffect(() => {
    if (!api || !running) return
    const timer = window.setInterval(() => api.scrollNext(), 6000)
    return () => window.clearInterval(timer)
  }, [api, running, selected])

  if (slides.length === 0) return null
  const arrow = "absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50 focus-visible:ring-[3px] focus-visible:ring-white/70"

  return (
    <section aria-label="Featured promotions" className="relative self-start rounded-xl"
      onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
      <Carousel setApi={setApi} opts={{ loop: slides.length > 1 }} aria-label="Promotional slides">
        <CarouselContent className="ml-0">
          {slides.map((slide, i) => {
            const { icon: Icon, bg } = art[i % art.length]
            return (
              <CarouselItem key={slide.id} className="pl-0" aria-hidden={i !== selected} inert={i !== selected}>
                <div className={`relative h-[27rem] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${bg} text-white sm:aspect-[3/1] sm:h-auto`}>
                  {slide.artwork && <Image src={slide.artwork!} alt="" fill preload={i === 0} sizes="(max-width: 1024px) 100vw, 75vw" className="!top-auto !h-[48%] object-cover object-right sm:!top-0 sm:!h-full sm:object-contain sm:object-center" />}
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10 sm:bg-gradient-to-r sm:from-black/15 sm:to-transparent" />
                  <div className="absolute inset-y-0 left-0 z-10 flex w-full flex-col items-start justify-start gap-2 px-10 pb-14 pt-7 sm:w-[52%] sm:justify-center sm:px-12 sm:py-5">
                    <span className="rounded-md bg-orange-500 px-3 py-1 text-xs font-semibold">{slide.eyebrow}</span>
                    <h2 className="max-w-sm text-[2rem] font-extrabold leading-[1.04] tracking-tight sm:text-3xl xl:text-[2.75rem]">{slide.title}</h2>
                    <p className="max-w-xs text-sm text-white/90">{slide.description}</p>
                    <Link href={slide.href} className="mt-2 inline-flex h-10 shrink-0 items-center gap-3 rounded-lg bg-primary px-5 text-sm font-bold text-white shadow-sm transition-transform hover:translate-x-1 hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-white/60">
                      {slide.action} <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                  {!slide.artwork && <Icon className="absolute bottom-10 right-10 size-40 text-white/30" strokeWidth={0.9} aria-hidden="true" />}
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
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/40 py-1 pl-1 pr-3 shadow-lg backdrop-blur-md">
            <button type="button" aria-label={userPaused || reduceMotion ? "Play slideshow" : "Pause slideshow"} disabled={reduceMotion}
              onClick={() => setUserPaused((v) => !v)}
              className="grid size-6 place-items-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/35 focus-visible:ring-[3px] focus-visible:ring-white/70 disabled:opacity-40">
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
                          />
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
