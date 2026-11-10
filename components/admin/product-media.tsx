"use client"
import Image from "next/image"
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { ChevronLeft, ChevronRight, GripVertical, ImageOff, Star, Trash2, Undo2 } from "lucide-react"
import { ImageUploader } from "./image-uploader"
import { ProductArt } from "@/components/store/product-art"
import { Button } from "@/components/ui/button"
import { money } from "@/features/admin/format"
import type { AdminImage } from "@/features/admin/types"
import { MEDIA_LIMITS } from "@/lib/media"

const MAX = MEDIA_LIMITS.maxImagesPerProduct
const LOW_PX = 800

type Card = { slug: string; title: string; brand: string; category: string; pricePaise: number }

/**
 * The product's photo gallery: upload, reorder (drag, or the move buttons for keyboard and touch), choose the main photo,
 * describe each photo, remove with undo. Nothing is saved from here: the parent form sends the list with the product.
 */
export function ProductMedia({ images, onChange, dirty, disabled = false, card }: {
  images: AdminImage[]; onChange: Dispatch<SetStateAction<AdminImage[]>>; dirty: boolean; disabled?: boolean; card: Card
}) {
  const [announce, setAnnounce] = useState("")
  const [undo, setUndo] = useState<{ image: AdminImage; index: number } | null>(null)
  const [drag, setDrag] = useState<{ from: number; over: number | null } | null>(null)
  const undoTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(undoTimer.current), [])

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return
    onChange((all) => { const next = [...all]; const [m] = next.splice(from, 1); next.splice(to, 0, m); return next })
    setAnnounce(to === 0 ? `Photo ${from + 1} is now the main photo.` : `Moved photo ${from + 1} to position ${to + 1} of ${images.length}.`)
  }
  const setAlt = (i: number, alt: string) => onChange((all) => all.map((m, k) => (k === i ? { ...m, alt } : m)))
  const remove = (i: number) => {
    const image = images[i]
    onChange((all) => all.filter((_, k) => k !== i))
    setUndo({ image, index: i })
    setAnnounce(`Removed photo ${i + 1}. Undo is available.`)
    window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setUndo(null), 9000)
  }
  const restore = () => {
    if (!undo) return
    const u = undo
    onChange((all) => (all.length >= MAX ? all : [...all.slice(0, u.index), u.image, ...all.slice(u.index)]))
    setUndo(null)
    setAnnounce("Photo restored.")
  }

  const iconBtn = "size-8"
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
      <section aria-labelledby="media-h" className="grid gap-4 rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex items-baseline gap-2">
            <h2 id="media-h" className="font-semibold">Photos</h2>
            <span className="text-sm text-muted-foreground" aria-label={`${images.length} of ${MAX} photos`}>{images.length} of {MAX} photos</span>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {dirty && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"><span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" /> Unsaved</span>}
            Changes are saved with the product.
          </p>
        </div>

        <ImageUploader kind="product" remaining={MAX - images.length} disabled={disabled} disabledReason="You don't have permission to change product photos."
          hint="JPG, PNG, WebP or AVIF, up to 5 MB each, at least 800 px, square works best."
          onUploaded={(img) => onChange((all) => (all.length >= MAX ? all : [...all, { url: img.url, alt: "", width: img.width, height: img.height }]))} />

        {undo && (
          <p role="status" className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
            <span>Photo removed.</span>
            <Button type="button" size="sm" variant="outline" onClick={restore} disabled={images.length >= MAX}><Undo2 aria-hidden="true" /> Undo</Button>
          </p>
        )}

        {images.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><ImageOff className="size-4 shrink-0" aria-hidden="true" /> No photos yet. Shoppers will see a placeholder icon until you add one.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">The first photo is the card image and the one shoppers see first. Drag photos to reorder, or use the arrow buttons.</p>
            <ol aria-label="Product photos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {images.map((img, i) => {
                const low = img.width != null && img.height != null && Math.max(img.width, img.height) < LOW_PX
                const dragging = drag?.from === i, target = drag?.over === i && drag.from !== i
                return (
                  <li key={img.url}
                    onDragOver={(e) => { if (drag && !disabled) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (drag.over !== i) setDrag({ ...drag, over: i }) } }}
                    onDrop={(e) => { if (!drag) return; e.preventDefault(); move(drag.from, i); setDrag(null) }}
                    className={`grid content-start overflow-hidden rounded-xl border bg-background transition-shadow ${dragging ? "opacity-40" : ""} ${target ? "ring-2 ring-primary" : ""}`}>
                    <div draggable={!disabled}
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); setDrag({ from: i, over: null }) }}
                      onDragEnd={() => setDrag(null)}
                      className={`relative aspect-square bg-gradient-to-br from-neutral-50 to-neutral-200/80 dark:from-neutral-800 dark:to-neutral-900 ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}>
                      <Image src={img.url} alt={img.alt || `Product photo ${i + 1}`} fill sizes="(max-width: 640px) 45vw, 220px" draggable={false} className="pointer-events-none object-contain p-2" />
                      <span className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-xs font-semibold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-background/90 text-muted-foreground"}`}>{i === 0 ? "Main" : i + 1}</span>
                      {!disabled && <span aria-hidden="true" className="absolute right-2 top-2 grid size-6 place-items-center rounded-md bg-background/90 text-muted-foreground"><GripVertical className="size-4" /></span>}
                      {low && <span className="absolute bottom-2 left-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">Small: may look soft</span>}
                    </div>
                    <div className="grid gap-1.5 p-2.5">
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className={iconBtn} aria-label={`Move photo ${i + 1} earlier`} disabled={disabled || i === 0} onClick={() => move(i, i - 1)}><ChevronLeft aria-hidden="true" /></Button>
                        <Button type="button" variant="outline" size="icon" className={iconBtn} aria-label={`Move photo ${i + 1} later`} disabled={disabled || i === images.length - 1} onClick={() => move(i, i + 1)}><ChevronRight aria-hidden="true" /></Button>
                        {i > 0 && <Button type="button" variant="outline" size="icon" className={iconBtn} aria-label={`Set photo ${i + 1} as main`} title="Set as main" disabled={disabled} onClick={() => move(i, 0)}><Star aria-hidden="true" /></Button>}
                        <Button type="button" variant="destructive" size="icon" className={`${iconBtn} ml-auto`} aria-label={`Remove photo ${i + 1}`} disabled={disabled} onClick={() => remove(i)}><Trash2 aria-hidden="true" /></Button>
                      </div>
                      <label htmlFor={`alt-${i}-${img.url}`} className="sr-only">Description of photo {i + 1}</label>
                      <input id={`alt-${i}-${img.url}`} value={img.alt} maxLength={MEDIA_LIMITS.altMax} disabled={disabled} onChange={(e) => setAlt(i, e.target.value)} placeholder="Describe the photo for screen readers"
                        className="h-9 w-full rounded-lg border bg-background px-2.5 text-xs outline-none placeholder:text-muted-foreground/70 focus-visible:ring-[3px] focus-visible:ring-ring/40" />
                      <p className="flex justify-between text-[11px] text-muted-foreground"><span>{img.width && img.height ? `${img.width} × ${img.height}` : ""}</span><span aria-label={`${img.alt.length} of ${MEDIA_LIMITS.altMax} characters`}>{img.alt.length}/{MEDIA_LIMITS.altMax}</span></p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </>
        )}
        <p role="status" aria-live="polite" className="sr-only">{announce}</p>
      </section>

      <aside aria-label="Product card preview" className="grid content-start gap-3 rounded-2xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">How it looks on a product card</h2>
        <div className="w-full max-w-56 rounded-2xl border bg-card p-3 shadow-xs">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-200/80 dark:from-neutral-800 dark:to-neutral-900">
            <ProductArt slug={card.slug} title="" category={card.category} images={images} sizes="224px" />
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground">{card.brand || "Brand"}</p>
          <p className="line-clamp-2 min-h-[2.6em] text-sm font-medium">{card.title || "Product title"}</p>
          <p className="price mt-1 font-semibold text-primary">{card.pricePaise > 0 ? money(card.pricePaise) : "₹0"}</p>
        </div>
        <p className="text-xs text-muted-foreground">{images.length > 1 ? "On hover, shoppers see the second photo." : "Add a second photo to show it on hover."}</p>
      </aside>
    </div>
  )
}
