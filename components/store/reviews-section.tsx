import { distributionFor, reviewsFor } from "@/features/reviews/demo"
import type { Product } from "@/features/catalog/demo"
import { ReviewsCarousel } from "./reviews-carousel"
import { Stars } from "./stars"

export function ReviewsSection({ product }: { product: Product }) {
  const avg = product.rating ?? 4.5
  const dist = distributionFor(avg)
  const reviews = reviewsFor(product.id, avg)
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
      <h2 id="reviews-heading" className="section-title">Customer reviews</h2>
      <p className="mt-1 text-xs text-muted-foreground">Sample reviews shown for the demo store.</p>
      <div className="mt-4 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="grid content-start gap-3 rounded-xl border bg-card p-5">
          <p className="flex items-end gap-2"><span className="price text-5xl font-bold">{avg}</span><span className="pb-1.5 text-sm text-muted-foreground">out of 5</span></p>
          <Stars value={avg} className="size-5" />
          <p className="text-sm text-muted-foreground">{product.reviews} ratings</p>
          <ul className="mt-2 grid gap-2">
            {dist.map((pct, i) => (
              <li key={i} className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
                <span>{5 - i} star</span>
                <span className="h-2 rounded-full bg-muted" aria-hidden="true"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} /></span>
                <span className="price text-right text-muted-foreground">{pct}%</span>
              </li>
            ))}
          </ul>
        </div>
        <ReviewsCarousel reviews={reviews} />
      </div>
    </section>
  )
}
