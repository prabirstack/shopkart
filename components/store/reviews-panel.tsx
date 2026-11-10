"use client"
import Link from "next/link"
import { useState } from "react"
import { PenLine } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import type { ReviewsData } from "@/features/reviews/data"
import { ReviewForm } from "./review-form"
import { ReviewsCarousel } from "./reviews-carousel"
import { Stars } from "./stars"

/** Exact totals, like 5,601 rather than "5.6K". */
const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n)

/**
 * Rating summary, filterable reviews and the "write a review" form. Everything shown is an approved review from the
 * database; a review you just wrote is held for checking and appears here only after staff approve it.
 */
export function ReviewsPanel({ productId, slug, title, data }: { productId: string; slug: string; title: string; data: ReviewsData }) {
  const { data: session, isPending } = authClient.useSession()
  const [filter, setFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)
  const [writing, setWriting] = useState(false)
  const [sent, setSent] = useState(false)

  const total = data.count || 1
  const list = data.items.filter((r) => filter === 0 || r.rating === filter)
  const signIn = `/login?next=${encodeURIComponent(`/products/${slug}`)}`

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="reviews-heading" className="section-title">Customer reviews</h2></div>
        {!sent && !writing && (session || isPending
          ? <Button disabled={isPending} onClick={() => setWriting(true)}><PenLine aria-hidden="true" /> Write a review</Button>
          : <Link href={signIn} className={buttonVariants()}><PenLine aria-hidden="true" /> Sign in to write a review</Link>)}
      </div>
      <div className="mt-4 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="grid content-start gap-3 rounded-xl border bg-card p-5">
          {data.count === 0 ? <p className="text-sm text-muted-foreground">No ratings yet.</p> : (
            <>
              <p className="flex items-end gap-2"><span className="price text-5xl font-bold">{data.average}</span><span className="pb-1.5 text-sm text-muted-foreground">out of 5</span></p>
              <Stars value={data.average ?? 0} className="size-5" />
              <p className="text-sm text-muted-foreground">{fmt(data.count)} ratings</p>
              <ul className="mt-2 grid gap-1" aria-label="Filter reviews by rating">
                {([5, 4, 3, 2, 1] as const).map((star) => { const c = data.distribution[star] ?? 0; const pct = Math.round((c / total) * 100); return (
                  <li key={star}>
                    <button type="button" aria-pressed={filter === star} onClick={() => setFilter(filter === star ? 0 : star)} className={`grid w-full grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 rounded-md px-1 py-1 text-xs hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 ${filter === star ? "bg-primary/10 font-semibold" : ""}`}>
                      <span>{star} star</span><span className="h-2 rounded-full bg-muted" aria-hidden="true"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} /></span><span className="price text-right text-muted-foreground">{pct}%</span>
                    </button>
                  </li>) })}
              </ul>
              {filter !== 0 && <button type="button" onClick={() => setFilter(0)} className="w-fit text-xs font-medium text-primary hover:underline">Clear filter</button>}
            </>
          )}
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
          {writing && !sent && <ReviewForm productSlug={slug} productId={productId} productTitle={title} authorName={session?.user.name ?? ""} onSubmitted={() => { setWriting(false); setSent(true) }} />}
          {sent && (
            <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Thanks! Your review will appear after it is checked.</p>
            </div>
          )}
          {list.length === 0
            ? <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">{filter === 0 ? "No reviews yet. Be the first to share what you think." : `No ${filter}-star reviews yet.`}</p>
            : <ReviewsCarousel key={filter} reviews={list} signedIn={!!session} signInHref={signIn} />}
        </div>
      </div>
    </section>
  )
}
