"use client"
import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { track } from "@/features/analytics/track"

const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"]

/** "Write a review" form. Posts to the reviews API; reviews are held for moderation before they appear to other shoppers. */
export function ReviewForm({ productSlug, productId, productTitle, authorName, onSubmitted }: { productSlug: string; productId: string; productTitle: string; authorName: string; onSubmitted?: () => void }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const clear = (k: string) => setErrs((e) => ({ ...e, [k]: "" }))
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (rating < 1) er.rating = "Choose a star rating."
    if (title.trim().length < 3) er.title = "Add a short headline (at least 3 characters)."
    if (body.trim().length < 20) er.body = "Tell others a little more (at least 20 characters)."
    if (body.length > 1500) er.body = "Please keep it under 1500 characters."
    setErrs(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/products/${encodeURIComponent(productSlug)}/reviews`, {
        method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating, title: title.trim(), body: body.trim() }),
      })
      if (res.ok) { track("submit_review", { item_id: productId, rating }); onSubmitted?.(); return }
      const err = (await res.json().catch(() => null))?.error as { code?: string; message?: string; details?: { path: string; message: string }[] } | undefined
      if (res.status === 401) setErrs({ form: "Your session has ended. Please sign in again to post a review." })
      else if (err?.details?.length) {
        const next: Record<string, string> = {}
        for (const d of err.details) next[d.path === "rating" || d.path === "title" || d.path === "body" ? d.path : "form"] = d.message
        setErrs(next)
      } else setErrs({ form: err?.message ?? "We couldn't send your review. Please try again." })
    } catch {
      setErrs({ form: "We couldn't reach the server. Check your connection and try again." })
    } finally { setBusy(false) }
  }

  const shown = hover || rating
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs" aria-label={`Write a review for ${productTitle}`}>
      <div>
        <h3 className="font-semibold">Review {productTitle}</h3>
        <p className="text-xs text-muted-foreground">Share what you liked and what could be better. Reviews are checked before they&apos;re published.</p>
      </div>
      <fieldset className="grid gap-1.5" aria-describedby={errs.rating ? "rv-rating-error" : undefined}>
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} onMouseEnter={() => setHover(n)} className="cursor-pointer rounded-md p-0.5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => { setRating(n); clear("rating") }} className="sr-only" aria-label={`${n} ${n === 1 ? "star" : "stars"}, ${LABELS[n]}`} />
              <Star className={`size-8 transition-colors ${n <= shown ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} aria-hidden="true" />
            </label>
          ))}
          <span className="ml-2 text-sm text-muted-foreground" aria-live="polite">{shown ? LABELS[shown] : "Select a rating"}</span>
        </div>
        {errs.rating && <p id="rv-rating-error" role="alert" className="text-xs text-destructive">{errs.rating}</p>}
      </fieldset>
      <div className="grid gap-1.5"><label htmlFor="rv-title" className="text-sm font-medium">Headline</label><input id="rv-title" value={title} onChange={(e) => { setTitle(e.target.value); clear("title") }} maxLength={80} aria-invalid={errs.title ? true : undefined} className={input} />{errs.title && <p role="alert" className="text-xs text-destructive">{errs.title}</p>}</div>
      <div className="grid gap-1.5"><label htmlFor="rv-body" className="text-sm font-medium">Your review</label><textarea id="rv-body" value={body} onChange={(e) => { setBody(e.target.value); clear("body") }} rows={5} maxLength={1500} aria-invalid={errs.body ? true : undefined} className={`${input} h-auto py-2`} /><p className="text-xs text-muted-foreground">{body.length} / 1500</p>{errs.body && <p role="alert" className="text-xs text-destructive">{errs.body}</p>}</div>
      <p className="text-xs text-muted-foreground">Posted as <strong className="text-foreground">{authorName || "you"}</strong>, with the name on your account.</p>
      {errs.form && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{errs.form}</p>}
      <div><Button type="submit" disabled={busy}>{busy ? "Sending..." : "Submit review"}</Button></div>
    </form>
  )
}
