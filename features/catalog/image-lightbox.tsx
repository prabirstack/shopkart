"use client"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react"

const MIN = 1
const MAX = 4

/**
 * Full-screen viewer: zoom with buttons, keys (+ - 0) or the mouse wheel, drag to pan,
 * arrow keys to change image, Esc to close. Uses the native <dialog> for focus trapping.
 */
export function ImageLightbox({ icon: Icon, title, views, photos = [], start, onClose }: {
  icon: LucideIcon; title: string; views: string[]; photos?: string[]; start: number; onClose: (lastIndex: number) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [index, setIndex] = useState(start)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const d = ref.current
    // No close() in cleanup: removing the element closes it, and closing here would fire
    // onClose and shut the viewer again under React StrictMode's double effect run.
    if (d && !d.open) d.showModal()
  }, [])

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])
  const change = useCallback((delta: number) => { setIndex((i) => (i + delta + views.length) % views.length); reset() }, [views.length, reset])
  const zoomBy = useCallback((delta: number) => {
    setZoom((z) => { const next = Math.min(MAX, Math.max(MIN, +(z + delta).toFixed(2))); if (next === MIN) setPan({ x: 0, y: 0 }); return next })
  }, [])

  const btn = "grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:ring-[3px] focus-visible:ring-white/60 disabled:opacity-40"
  return (
    <dialog ref={ref} aria-label={`${title}, full-size images`} onClose={() => onClose(index)}
      onKeyDown={(e) => {
        if (e.key === "+" || e.key === "=") zoomBy(0.5)
        else if (e.key === "-") zoomBy(-0.5)
        else if (e.key === "0") reset()
        else if (e.key === "ArrowRight") change(1)
        else if (e.key === "ArrowLeft") change(-1)
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-neutral-950 p-0 text-white backdrop:bg-black">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 p-3">
          <p className="min-w-0 truncate text-sm"><span className="font-semibold">{title}</span> <span className="text-white/60">· {views[index]} view · {index + 1}/{views.length}</span></p>
          <div className="flex items-center gap-2">
            <button type="button" className={btn} aria-label="Zoom out" disabled={zoom <= MIN} onClick={() => zoomBy(-0.5)}><Minus className="size-4" aria-hidden="true" /></button>
            <span className="price w-12 text-center text-sm" aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button type="button" className={btn} aria-label="Zoom in" disabled={zoom >= MAX} onClick={() => zoomBy(0.5)}><Plus className="size-4" aria-hidden="true" /></button>
            <button type="button" className={btn} aria-label="Reset zoom" disabled={zoom === MIN} onClick={reset}><RotateCcw className="size-4" aria-hidden="true" /></button>
            <button type="button" className={btn} aria-label="Close full-size view" onClick={() => ref.current?.close()}><X className="size-5" aria-hidden="true" /></button>
          </div>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden"
          onWheel={(e) => zoomBy(e.deltaY < 0 ? 0.25 : -0.25)}
          onPointerDown={(e) => { if (zoom > MIN) { drag.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y }; setDragging(true); e.currentTarget.setPointerCapture(e.pointerId) } }}
          onPointerMove={(e) => { if (drag.current) setPan({ x: drag.current.ox + e.clientX - drag.current.x, y: drag.current.oy + e.clientY - drag.current.y }) }}
          onPointerUp={() => { drag.current = null; setDragging(false) }}
          style={{ cursor: zoom > MIN ? (dragging ? "grabbing" : "grab") : "zoom-in", touchAction: "none" }}
          onDoubleClick={() => (zoom > MIN ? reset() : zoomBy(1))}>
          <div className="absolute inset-0 grid place-items-center" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: dragging ? "none" : "transform 150ms ease-out" }}>
            <div className="relative grid aspect-square h-[min(80dvh,80vw)] place-items-center rounded-2xl bg-neutral-100">{photos[index] ? <Image src={photos[index]} alt={`${title}, ${views[index]} view`} fill sizes="80vw" className="pointer-events-none select-none object-contain p-6" draggable={false} /> : <Icon className="size-1/3 text-neutral-700" strokeWidth={1} aria-hidden="true" />}</div>
          </div>
          <button type="button" aria-label="Previous image" className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`} onClick={() => change(-1)}><ChevronLeft className="size-5" aria-hidden="true" /></button>
          <button type="button" aria-label="Next image" className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`} onClick={() => change(1)}><ChevronRight className="size-5" aria-hidden="true" /></button>
        </div>
        <ul className="flex justify-center gap-2 p-3">
          {views.map((v, i) => (
            <li key={v}><button type="button" aria-label={`Show ${v.toLowerCase()} view`} aria-pressed={i === index} onClick={() => { setIndex(i); reset() }}
              className={`relative grid size-14 place-items-center overflow-hidden rounded-lg bg-neutral-100 focus-visible:ring-[3px] focus-visible:ring-white/60 ${i === index ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"}`}>
              {photos[i] ? <Image src={photos[i]} alt="" fill sizes="56px" className="object-contain p-1" /> : <Icon className="size-6 text-neutral-600" strokeWidth={1.25} aria-hidden="true" />}</button></li>
          ))}
        </ul>
        <p className="pb-3 text-center text-xs text-white/50">Scroll or press + / − to zoom · drag to move · ← → to change image · Esc to close</p>
      </div>
    </dialog>
  )
}
