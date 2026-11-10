"use client"
import Image from "next/image"
import { useState } from "react"
import { ChevronRight, ImageOff, RefreshCw, Trash2 } from "lucide-react"
import { ImageUploader } from "./image-uploader"
import { Button } from "@/components/ui/button"
import type { AdminImage } from "@/features/admin/types"
import { BANNER_SIZES, MEDIA_LIMITS } from "@/lib/media"

type Slot = keyof typeof BANNER_SIZES

/**
 * One banner image: upload, a large preview in the placement's shape, replace, remove, a description for screen readers,
 * and a small preview of how the banner reads on the storefront. The banner can still be saved without an image.
 */
export function BannerImageField({ slot, title, value, onChange, disabled = false }: {
  slot: Slot; title: string; value: AdminImage | null; onChange: (image: AdminImage | null) => void; disabled?: boolean
}) {
  const size = BANNER_SIZES[slot]
  const [replacing, setReplacing] = useState(false)
  const frame = { aspectRatio: `${size.width} / ${size.height}` }
  const small = value?.width != null && value.width < size.width * 0.75
  const showUploader = !value || replacing

  return (
    <fieldset className="grid gap-3 rounded-xl border p-3 sm:p-4" disabled={disabled}>
      <legend className="px-1 text-sm font-medium">Banner image <span className="font-normal text-muted-foreground">(optional)</span></legend>
      <p className="text-xs text-muted-foreground">Recommended <strong className="font-semibold text-foreground">{size.width} × {size.height} px</strong>. {size.note}</p>

      {showUploader ? (
        <div className="grid gap-2">
          <ImageUploader kind="banner" multiple={false} disabled={disabled} disabledReason="You don't have permission to change banner images."
            hint={`JPG, PNG, WebP or AVIF, up to 5 MB, at least ${MEDIA_LIMITS.minBannerWidthPx} px wide. Aim for ${size.width} × ${size.height}.`}
            onUploaded={(img) => { onChange({ url: img.url, alt: value?.alt ?? "", width: img.width, height: img.height }); setReplacing(false) }} />
          {replacing && <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setReplacing(false)}>Keep the current image</Button>}
        </div>
      ) : (
        <>
          <div className="relative w-full overflow-hidden rounded-xl border bg-muted" style={frame}>
            <Image src={value.url} alt={value.alt || "Banner preview"} fill sizes="(max-width: 768px) 90vw, 640px" className="object-cover" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setReplacing(true)}><RefreshCw aria-hidden="true" /> Replace image</Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => onChange(null)}><Trash2 aria-hidden="true" /> Remove image</Button>
            <span className="text-xs text-muted-foreground">{value.width && value.height ? `${value.width} × ${value.height} px` : ""}</span>
          </div>
          {small && <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900">This image is smaller than the recommended {size.width} px, so it may look soft on large screens.</p>}
          <div className="grid gap-1.5">
            <label htmlFor="bn-alt" className="text-sm font-medium">Image description</label>
            <input id="bn-alt" value={value.alt} maxLength={MEDIA_LIMITS.altMax} onChange={(e) => onChange({ ...value, alt: e.target.value })} placeholder="Describe the image for screen readers"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" />
            <p className="text-right text-xs text-muted-foreground" aria-label={`${value.alt.length} of ${MEDIA_LIMITS.altMax} characters`}>{value.alt.length}/{MEDIA_LIMITS.altMax}</p>
          </div>
          {slot === "home_hero" ? (
            <div className="grid gap-1.5">
              <p className="text-sm font-medium">How it looks on the home page</p>
              <div className="relative w-full max-w-sm overflow-hidden rounded-lg border bg-neutral-900 text-white" style={frame} aria-hidden="true">
                <Image src={value.url} alt="" fill sizes="384px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-start justify-center gap-1.5 px-5">
                  <p className="line-clamp-2 max-w-[60%] text-sm font-bold leading-tight">{title || "Your headline"}</p>
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-semibold">Shop now <ChevronRight className="size-3" /></span>
                </div>
              </div>
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground"><ImageOff className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> Only the Home hero placement shows images on the storefront today. This image is saved for when this placement goes live.</p>
          )}
        </>
      )}
      {!value && slot !== "home_hero" && <p className="text-xs text-muted-foreground">Only the Home hero placement shows images on the storefront today.</p>}
    </fieldset>
  )
}
