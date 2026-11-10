"use client"
import { useState } from "react"
import { Clock, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReviewForm } from "./review-form"
import { ReviewsCarousel } from "./reviews-carousel"
import { Stars } from "./stars"
import type { Review } from "@/features/reviews/demo"
import { useReviewStore, useReviewsReady } from "@/features/reviews/store"

/** Exact totals so a new review visibly counts: 5,601, not "5.6K". */
const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n)
const date = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`))

/**
 * Rating summary, filterable reviews and the "write a review" form. Approved shopper reviews are
 * merged with the sample reviews and the summary is recalculated, so a new review visibly counts.
 */
export function ReviewsPanel({ productId, title, totalRatings, distribution, sample }: {
  productId: string; title: string; totalRatings: number; distribution: number[]; sample: Review[]
}) {
  const ready = useReviewsReady()
  const all = useReviewStore((s) => s.reviews)
  const [filter, setFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)
  const [writing, setWriting] = useState(false)

  const mine = ready ? all.filter((r) => r.productId === productId) : []
  const approved = mine.filter((r) => r.status === "approved")
  const pending = mine.filter((r) => r.status === "pending")
  const myActive = mine.find((r) => r.status !== "rejected")

  // Star counts, index 0 = 5 stars. Sample counts come from the distribution; approved shopper reviews add to them.
  const counts = distribution.map((pct) => Math.round((pct / 100) * totalRatings))
  approved.forEach((r) => { counts[5 - r.rating] += 1 })
  const total = counts.reduce((s, c) => s + c, 0) || 1
  const stats = { counts, total, avg: Math.round((counts.reduce((s, c, i) => s + c * (5 - i), 0) / total) * 10) / 10 }

  const list: Review[] = [
    ...approved.map((r): Review => ({ id: r.id, name: r.name, rating: r.rating, title: r.title, body: r.body, date: date(r.date), verified: r.verified, source: "shopper" })),
    ...sample,
  ].filter((r) => filter === 0 || r.rating === filter)

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="reviews-heading" className="section-title">Customer reviews</h2><p className="mt-1 text-xs text-muted-foreground">Includes sample reviews for the demo store{approved.length > 0 && ` and ${approved.length} from shoppers`}.</p></div>
        {!myActive && !writing && <Button onClick={() => setWriting(true)}><PenLine aria-hidden="true" /> Write a review</Button>}
      </div>
      <div className="mt-4 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="grid content-start gap-3 rounded-xl border bg-card p-5">
          <p className="flex items-end gap-2"><span className="price text-5xl font-bold">{stats.avg}</span><span className="pb-1.5 text-sm text-muted-foreground">out of 5</span></p>
          <Stars value={stats.avg} className="size-5" />
          <p className="text-sm text-muted-foreground">{fmt(stats.total)} ratings</p>
          <ul className="mt-2 grid gap-1" aria-label="Filter reviews by rating">
            {stats.counts.map((c, i) => { const star = (5 - i) as 1 | 2 | 3 | 4 | 5; const pct = Math.round((c / stats.total) * 100); return (
              <li key={star}>
                <button type="button" aria-pressed={filter === star} onClick={() => setFilter(filter === star ? 0 : star)} className={`grid w-full grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 rounded-md px-1 py-1 text-xs hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 ${filter === star ? "bg-primary/10 font-semibold" : ""}`}>
                  <span>{star} star</span><span className="h-2 rounded-full bg-muted" aria-hidden="true"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} /></span><span className="price text-right text-muted-foreground">{pct}%</span>
                </button>
              </li>) })}
          </ul>
          {filter !== 0 && <button type="button" onClick={() => setFilter(0)} className="w-fit text-xs font-medium text-primary hover:underline">Clear filter</button>}
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
          {writing && !myActive && <ReviewForm productId={productId} productTitle={title} onSubmitted={() => setWriting(false)} />}
          {pending.map((r) => (
            <div key={r.id} role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div className="text-sm"><p className="font-semibold">Thanks! Your review is awaiting approval</p><p className="mt-0.5"><Stars value={r.rating} className="size-3.5" /> <strong>{r.title}</strong></p><p className="mt-1 line-clamp-2 text-amber-900/80">{r.body}</p></div>
            </div>
          ))}
          {list.length === 0 ? <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">No {filter}-star reviews yet.</p> : <ReviewsCarousel key={filter} reviews={list} />}
        </div>
      </div>
    </section>
  )
}
