"use client"
import Image from "next/image"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, ImagePlus, RotateCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { failureMessage } from "@/features/admin/api"
import { precheckFile, readDimensions, uploadImage, type UploadedImage } from "@/features/admin/upload"
import { ACCEPT_ATTR, MEDIA_LIMITS, type MediaKind } from "@/lib/media"

const PARALLEL = 3
type Item = { id: string; file: File; preview: string; progress: number; status: "queued" | "uploading" | "done" | "error"; message?: string; retryable?: boolean }
const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

/**
 * Drop zone plus upload queue, shared by the product gallery and the banner form.
 * It only uploads: each finished file is handed to `onUploaded`, and the parent decides what to do with it
 * (add a tile, replace the banner image). Files are checked in the browser first with the same rules and
 * messages as the server, then sent up to three at a time with real progress.
 */
export function ImageUploader({ kind, multiple = true, remaining = Infinity, disabled = false, disabledReason, hint, onUploaded }: {
  kind: MediaKind
  multiple?: boolean
  /** How many more files the parent can still accept (for example 8 minus the photos already added). */
  remaining?: number
  disabled?: boolean
  disabledReason?: string
  /** The size and format line under the title. */
  hint: string
  onUploaded: (image: UploadedImage, file: File) => void
}) {
  const inputId = useId()
  const [items, setItems] = useState<Item[]>([])
  const [over, setOver] = useState(false)
  const [announce, setAnnounce] = useState("")
  const started = useRef(new Set<string>())
  const timers = useRef(new Set<number>())
  const onUploadedRef = useRef(onUploaded)
  // Finished uploads are handed to the parent in the order the files were picked, not the order they happened to finish.
  const order = useRef<{ id: string; state: "pending" | "done" | "failed"; result?: UploadedImage; file: File }[]>([])
  const flush = useCallback(() => {
    while (order.current.length && order.current[0].state !== "pending") {
      const head = order.current.shift()!
      if (head.state === "done" && head.result) onUploadedRef.current(head.result, head.file)
    }
  }, [])
  const itemsRef = useRef<Item[]>([])
  useEffect(() => { itemsRef.current = items; onUploadedRef.current = onUploaded })

  const patch = useCallback((id: string, p: Partial<Item>) => setItems((all) => all.map((i) => (i.id === id ? { ...i, ...p } : i))), [])
  const drop = useCallback((id: string) => setItems((all) => { const it = all.find((i) => i.id === id); if (it) URL.revokeObjectURL(it.preview); return all.filter((i) => i.id !== id) }), [])

  useEffect(() => () => { for (const t of timers.current) window.clearTimeout(t); for (const i of itemsRef.current) URL.revokeObjectURL(i.preview) }, [])

  const run = useCallback(async (item: Item) => {
    patch(item.id, { status: "uploading", progress: 0, message: undefined })
    try {
      // Catch a photo that is too small before spending the upload; browsers that can't decode the format skip this and the server decides.
      const dim = await readDimensions(item.file)
      const L = MEDIA_LIMITS
      if (dim && kind === "product" && Math.max(dim.width, dim.height) < L.minProductPx) throw Object.assign(new Error(`That photo is ${dim.width} x ${dim.height} px. Product photos need at least ${L.minProductPx} px on the long side.`), { local: true })
      if (dim && kind === "banner" && dim.width < L.minBannerWidthPx) throw Object.assign(new Error(`That image is ${dim.width} px wide. Banners need at least ${L.minBannerWidthPx} px.`), { local: true })
      const result = await uploadImage(item.file, kind, (f) => patch(item.id, { progress: f }))
      patch(item.id, { status: "done", progress: 1 })
      setAnnounce(`Uploaded ${item.file.name}.`)
      const slot = order.current.find((o) => o.id === item.id)
      if (slot) { slot.state = "done"; slot.result = result } else onUploadedRef.current(result, item.file)
      flush()
      const t = window.setTimeout(() => { timers.current.delete(t); drop(item.id) }, 1400)
      timers.current.add(t)
    } catch (e) {
      const local = (e as { local?: boolean }).local
      const message = local ? (e as Error).message : failureMessage(e)
      const st = (e as { status?: number }).status
      const slot = order.current.find((o) => o.id === item.id)
      if (slot) slot.state = "failed"
      flush()
      patch(item.id, { status: "error", message, retryable: !local && (st === 0 || st === 429 || (st ?? 0) >= 500) })
      setAnnounce(`Couldn't upload ${item.file.name}. ${message}`)
    }
  }, [kind, patch, drop, flush])

  // Start queued uploads, three at a time.
  useEffect(() => {
    let active = items.filter((i) => i.status === "uploading").length
    for (const it of items) {
      if (active >= PARALLEL) break
      if (it.status === "queued" && !started.current.has(it.id)) { started.current.add(it.id); active++; void run(it) }
    }
  }, [items, run])

  const addFiles = (list: FileList | File[]) => {
    let files = Array.from(list)
    if (!multiple) files = files.slice(0, 1)
    if (files.length === 0) return
    const inFlight = items.filter((i) => i.status === "queued" || i.status === "uploading").length
    const room = Math.max(0, remaining - inFlight)
    const next: Item[] = []
    let queued = 0, skipped = 0
    for (const file of files) {
      const id = crypto.randomUUID()
      const problem = precheckFile(file)
      if (problem) { next.push({ id, file, preview: URL.createObjectURL(file), progress: 0, status: "error", message: problem, retryable: false }); continue }
      if (queued >= room) { skipped++; next.push({ id, file, preview: URL.createObjectURL(file), progress: 0, status: "error", message: `Not added: a product can have at most ${MEDIA_LIMITS.maxImagesPerProduct} photos.`, retryable: false }); continue }
      queued++
      order.current.push({ id, state: "pending", file })
      next.push({ id, file, preview: URL.createObjectURL(file), progress: 0, status: "queued" })
    }
    if (skipped) setAnnounce(`${skipped} ${skipped === 1 ? "photo was" : "photos were"} not added: a product can have at most ${MEDIA_LIMITS.maxImagesPerProduct} photos.`)
    // A single-image field replaces its queue (a new pick supersedes an old failure).
    setItems((all) => (multiple ? [...all, ...next] : [...next]))
  }

  const full = remaining <= 0
  const blocked = disabled || full
  return (
    <div className="grid gap-3">
      <label
        htmlFor={inputId}
        onDragEnter={(e) => { if (!blocked && e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true) } }}
        onDragOver={(e) => { if (!blocked && e.dataTransfer.types.includes("Files")) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setOver(true) } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false) }}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!blocked) addFiles(e.dataTransfer.files) }}
        className={`relative grid cursor-pointer place-items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:border-primary has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 ${over ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"} ${blocked ? "cursor-not-allowed opacity-60 hover:border-border hover:bg-muted/30" : ""}`}>
        <input id={inputId} type="file" accept={ACCEPT_ATTR} multiple={multiple} disabled={blocked} className="sr-only"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }} />
        <span className={`grid size-11 place-items-center rounded-full ${over ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}><ImagePlus className="size-5" aria-hidden="true" /></span>
        <span className="font-medium">
          {over ? "Drop to upload" : <><span className="hidden sm:inline">{multiple ? "Drag photos here or " : "Drag an image here or "}</span><span className="sm:hidden text-primary underline underline-offset-4">{multiple ? "Tap to choose photos" : "Tap to choose an image"}</span><span className="hidden text-primary underline underline-offset-4 sm:inline">{multiple ? "browse" : "choose an image"}</span></>}
        </span>
        <span className="max-w-sm text-xs text-muted-foreground">{disabled && disabledReason ? disabledReason : full ? `You've reached the limit of ${MEDIA_LIMITS.maxImagesPerProduct} photos. Remove one to add another.` : hint}</span>
      </label>

      {items.length > 0 && (
        <ul aria-label="Uploads" className="grid gap-2">
          {items.map((it) => (
            <li key={it.id} className="grid min-h-16 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-card p-2.5">
              <span className="relative size-12 overflow-hidden rounded-lg bg-muted"><Image src={it.preview} alt="" fill unoptimized sizes="48px" className={`object-cover ${it.status === "error" ? "opacity-40" : ""}`} /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{it.file.name} <span className="font-normal text-muted-foreground">· {kb(it.file.size)}</span></p>
                {it.status === "error" ? (
                  <p role="alert" className="mt-0.5 flex items-start gap-1.5 text-xs text-destructive"><AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{it.message}</p>
                ) : it.status === "done" ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-3.5" aria-hidden="true" /> Uploaded</p>
                ) : (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div role="progressbar" aria-label={`Uploading ${it.file.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={it.status === "queued" ? undefined : Math.round(it.progress * 100)} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full bg-primary transition-[width] duration-150 ${it.status === "queued" || it.progress >= 1 ? "w-full animate-pulse opacity-60" : ""}`} style={it.status === "uploading" && it.progress < 1 ? { width: `${Math.max(4, Math.round(it.progress * 100))}%` } : undefined} />
                    </div>
                    <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">{it.status === "queued" ? "Waiting" : it.progress >= 1 ? "Processing" : `${Math.round(it.progress * 100)}%`}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {it.status === "error" && it.retryable && <Button type="button" size="sm" variant="outline" onClick={() => { started.current.delete(it.id); patch(it.id, { status: "queued", progress: 0, message: undefined }) }}><RotateCw aria-hidden="true" /> Retry</Button>}
                {(it.status === "error" || it.status === "queued") && <Button type="button" size="icon-sm" variant="ghost" aria-label={`Dismiss ${it.file.name}`} onClick={() => drop(it.id)}><X aria-hidden="true" /></Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p role="status" aria-live="polite" className="sr-only">{announce}</p>
    </div>
  )
}
