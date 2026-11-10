"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Headphones, Armchair, Pause, Play, Shirt, type LucideIcon } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import type { HeroSlide } from "@/features/promotions/demo"
import { usePrefersReducedMotion } from "./use-reduced-motion"

// Decorative artwork per slide. Text stays in HTML so it scales and is accessible.
const art: { icon: LucideIcon; bg: string }[] = [
  { icon: Headphones, bg: "from-neutral-950 via-red-950 to-red-700" },
  { icon: Armchair, bg: "from-neutral-900 via-amber-950 to-orange-700" },
  { icon: Shirt, bg: "from-neutral-900 via-fuchsia-950 to-pink-700" },
]

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
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
  const arrow = "absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/35 focus-visible:ring-[3px] focus-visible:ring-white/60"

  return (
    <section aria-label="Featured promotions" className="relative"
      onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
      <Carousel setApi={setApi} opts={{ loop: slides.length > 1 }} aria-label="Promotional slides">
        <CarouselContent className="ml-0">
          {slides.map((slide, i) => {
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
                    <Icon className="relative size-40 text-white/90 md:size-56" strokeWidth={0.9} />
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
          <div className="absolute inset-x-4 bottom-3 z-10 flex items-center gap-3">
            <div className="flex flex-1 gap-2" role="group" aria-label="Choose a slide">
              {slides.map((slide, i) => (
                <button key={slide.id} type="button" onClick={() => api?.scrollTo(i)}
                  aria-label={`Show slide ${i + 1}: ${slide.title}`} aria-current={selected === i}
                  className="group h-5 max-w-16 flex-1 py-2 focus-visible:outline-none">
                  <span className="relative block h-1 overflow-hidden rounded-full bg-white/40 group-focus-visible:ring-2 group-focus-visible:ring-white">
                    {selected === i && (
                      <span key={`${selected}-${running}`} className="absolute inset-y-0 left-0 block rounded-full bg-white"
                        style={!reduceMotion && slides.length > 1
                          ? { animation: "hero-progress 6s linear forwards", animationPlayState: running ? "running" : "paused" }
                          : { width: "100%" }}
                        onAnimationEnd={() => api?.scrollNext()} />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <button type="button" aria-label={userPaused || reduceMotion ? "Play slideshow" : "Pause slideshow"} disabled={reduceMotion}
              onClick={() => setUserPaused((v) => !v)}
              className="grid size-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/35 focus-visible:ring-[3px] focus-visible:ring-white/60 disabled:opacity-40">
              {userPaused || reduceMotion ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </>
      )}
      <p className="sr-only" aria-live={running ? "off" : "polite"}>Slide {selected + 1} of {slides.length}</p>
    </section>
  )
}
