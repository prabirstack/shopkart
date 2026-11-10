"use client"
import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn } from "lucide-react"
import Image from "next/image"
import { productById } from "./demo"
import { productImages } from "./images"
import { ImageLightbox } from "./image-lightbox"

const PLACEHOLDER_VIEWS = ["Front", "Side", "Back", "In use", "In the box"]
const HOVER_ZOOM = 2.2

/**
 * Thumbnails run down the left of the featured image on large screens (and sit below it on
 * phones). Hover zooms in place, click or the Enlarge button opens the full-screen viewer.
 * The placeholder icons swap for next/image photos later without changing any behaviour.
 */
export function ProductGallery({ productId, badge }: { productId: string; badge?: string }) {
  // Icons are functions and cannot cross the server/client boundary, so look the product up here.
  const product = productById(productId)!
  const Icon = product.icon
  // Real photos when they exist (main image first); otherwise five placeholder views.
  const photos = productImages(product.slug)
  const views = photos.length > 0 ? photos.map((_, i) => PLACEHOLDER_VIEWS[i] ?? `View ${i + 1}`) : PLACEHOLDER_VIEWS
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const touchStart = useRef<number | null>(null)
  const go = (delta: number) => setActive((a) => (a + delta + views.length) % views.length)

  const arrow = "absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-md hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
  return (
    <div className="grid gap-3 lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:items-start">
      <ul aria-label={`${product.title} images`} className="order-2 grid grid-cols-5 gap-2 lg:order-1 lg:grid-cols-1">
        {views.map((v, i) => (
          <li key={v}>
            <button type="button" onClick={() => setActive(i)} onMouseEnter={() => setActive(i)} aria-label={`Show ${v.toLowerCase()} view of ${product.title}`} aria-pressed={active === i}
              className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-neutral-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 ${active === i ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"}`}>
              {photos[i] ? <Image src={photos[i]} alt="" fill sizes="72px" className="object-contain p-1.5" /> : <Icon className="size-1/2 text-neutral-500" strokeWidth={1.25} aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
      <div className="relative order-1 lg:order-2">
        <div role="group" aria-roledescription="carousel" aria-label={`${product.title} featured image`} tabIndex={0}
          onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); else if (e.key === "Enter") setOpen(true) }}
          onPointerMove={(e) => { if (e.pointerType !== "mouse") return; const r = e.currentTarget.getBoundingClientRect(); setHover({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }) }}
          onPointerLeave={() => setHover(null)}
          onTouchStart={(e) => { touchStart.current = e.touches[0].clientX }}
          onTouchEnd={(e) => { if (touchStart.current === null) return; const dx = e.changedTouches[0].clientX - touchStart.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touchStart.current = null }}
          onClick={() => setOpen(true)}
          className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-neutral-100 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <div className="relative grid size-full place-items-center transition-transform duration-150 ease-out"
            style={{ transform: hover ? `scale(${HOVER_ZOOM})` : "scale(1)", transformOrigin: hover ? `${hover.x}% ${hover.y}%` : "50% 50%" }}>
            {photos[active] ? <Image src={photos[active]} alt={`${product.title}, ${views[active]} view`} fill priority={active === 0} sizes="(max-width: 1024px) 100vw, 45vw" className="object-contain p-6" /> : <Icon className="size-1/3 text-neutral-700" strokeWidth={1} aria-hidden="true" />}
          </div>
          {badge && <span className="absolute left-4 top-4 rounded-md bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">{badge}</span>}
          <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground"><ZoomIn className="size-3.5" aria-hidden="true" /> Hover to zoom · click to enlarge</span>
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground">{views[active]} · {active + 1}/{views.length}</span>
        </div>
        <button type="button" aria-label="Previous image" className={`${arrow} left-3`} onClick={() => go(-1)}><ChevronLeft className="size-5" aria-hidden="true" /></button>
        <button type="button" aria-label="Next image" className={`${arrow} right-3`} onClick={() => go(1)}><ChevronRight className="size-5" aria-hidden="true" /></button>
        <button type="button" aria-label="Open full-size view" className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-background/90 shadow-md hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50" onClick={() => setOpen(true)}><Maximize2 className="size-4" aria-hidden="true" /></button>
        <p role="status" className="sr-only">{views[active]} view, image {active + 1} of {views.length}</p>
      </div>
      {open && <ImageLightbox icon={Icon} title={product.title} views={views} photos={photos} start={active} onClose={(i) => { setActive(i); setOpen(false) }} />}
    </div>
  )
}
