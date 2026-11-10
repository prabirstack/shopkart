"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { BadgeCheck, ChevronLeft, ChevronRight, ThumbsUp } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import type { ReviewView } from "@/features/reviews/data"
import { Stars } from "./stars"

const date = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`))

/**
 * Customer reviews as swipeable cards with arrows and dots. "Helpful" is saved on the server per signed-in customer;
 * the button updates at once and goes back if the server says no.
 */
export function ReviewsCarousel({ reviews, signedIn, signInHref }: { reviews: ReviewView[]; signedIn: boolean; signInHref: string }) {
  // Per review: what the server last told us, so the count stays right after a toggle.
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [voted, setVoted] = useState<string[]>([])
  const [notice, setNotice] = useState<{ id: string; text: string; signIn?: boolean } | null>(null)
  const idsKey = reviews.map((r) => r.id).join(",")
  useEffect(() => {
    if (!signedIn || !idsKey) return
    let live = true
    void fetch(`/api/v1/reviews/voted?ids=${idsKey}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: { voted: string[]; counts: Record<string, number> } } | null) => { if (live && j?.data) { setVoted(j.data.voted); setCounts(j.data.counts) } })
      .catch(() => {})
    return () => { live = false }
  }, [signedIn, idsKey])

  const vote = async (id: string) => {
    if (!signedIn) { setNotice({ id, text: "Sign in to mark reviews helpful.", signIn: true }); return }
    const was = voted.includes(id)
    const base = counts[id] ?? reviews.find((r) => r.id === id)?.helpful ?? 0
    setNotice(null)
    setVoted((v) => (was ? v.filter((x) => x !== id) : [...v, id]))
    setCounts((c) => ({ ...c, [id]: Math.max(0, base + (was ? -1 : 1)) }))
    try {
      const res = await fetch(`/api/v1/reviews/${id}/helpful`, { method: "POST", credentials: "same-origin" })
      if (res.ok) {
        const out = (await res.json()).data as { helpful: boolean; count: number }
        setVoted((v) => (out.helpful ? [...new Set([...v, id])] : v.filter((x) => x !== id)))
        setCounts((c) => ({ ...c, [id]: out.count }))
        return
      }
      setNotice(res.status === 401 ? { id, text: "Sign in to mark reviews helpful.", signIn: true } : { id, text: res.status === 403 ? "You can't vote on your own review." : "Could not save your vote. Try again." })
    } catch { setNotice({ id, text: "Could not save your vote. Try again." }) }
    setVoted((v) => (was ? [...new Set([...v, id])] : v.filter((x) => x !== id)))
    setCounts((c) => ({ ...c, [id]: base }))
  }
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const [snaps, setSnaps] = useState(0)

  useEffect(() => {
    if (!api) return
    const update = () => { setSelected(api.selectedScrollSnap()); setSnaps(api.scrollSnapList().length) }
    update()
    api.on("select", update)
    api.on("reInit", update)
    return () => { api.off("select", update); api.off("reInit", update) }
  }, [api])

  const arrow = "grid size-9 place-items-center rounded-full border bg-card shadow-xs hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <Carousel setApi={setApi} opts={{ align: "start", loop: true, slidesToScroll: 1 }} aria-label="Customer reviews">
        <CarouselContent className="-ml-4">
          {reviews.map((r, i) => (
            <CarouselItem key={r.id} className="basis-full pl-4 xl:basis-1/2" aria-label={`Review ${i + 1} of ${reviews.length}`}>
              <article className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{r.name[0]}</span>
                    <div>
                      <p className="text-sm font-semibold">{r.name}</p>
                      {r.verified && <p className="flex items-center gap-1 text-xs text-emerald-700"><BadgeCheck className="size-3.5" aria-hidden="true" /> Verified purchase</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{date(r.date)}</p>
                </div>
                <div className="flex items-center gap-2"><Stars value={r.rating} /><h3 className="text-sm font-semibold">{r.title}</h3></div>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="min-w-0 text-xs text-muted-foreground" role="status">{notice?.id === r.id && (notice.signIn ? <Link href={signInHref} className="font-medium text-primary hover:underline">{notice.text}</Link> : notice.text)}</span>
                  <button type="button" onClick={() => void vote(r.id)} aria-pressed={voted.includes(r.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted ${voted.includes(r.id) ? "border-primary/40 bg-primary/5 text-primary" : ""}`}><ThumbsUp className={`size-3.5 ${voted.includes(r.id) ? "fill-primary/20" : ""}`} aria-hidden="true" /> Helpful{(counts[r.id] ?? r.helpful) > 0 && ` (${counts[r.id] ?? r.helpful})`}</button>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex items-center justify-between gap-4">
        <div role="group" aria-label="Choose review" className="flex gap-1.5">
          {Array.from({ length: snaps }, (_, i) => (
            <button key={i} type="button" aria-label={`Show review ${i + 1}`} aria-current={selected === i} onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 ${selected === i ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous review" className={arrow} onClick={() => api?.scrollPrev()}><ChevronLeft className="size-4" aria-hidden="true" /></button>
          <button type="button" aria-label="Next review" className={arrow} onClick={() => api?.scrollNext()}><ChevronRight className="size-4" aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  )
}
