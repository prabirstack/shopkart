import { Quote } from "lucide-react"
import { testimonials } from "@/features/reviews/demo"
import { SectionHeader } from "./section-header"
import { Stars } from "./stars"

export function TestimonialsSection() {
  return (
    <section aria-labelledby="testimonials-heading">
      <SectionHeader id="testimonials-heading" title="What our customers say" />
      <ul className="grid gap-4 md:grid-cols-3">
        {testimonials.map((t) => (
          <li key={t.id} className="relative flex flex-col gap-3 rounded-xl border bg-card p-5">
            <Quote className="size-6 text-primary/30" aria-hidden="true" />
            <blockquote className="flex-1 text-sm leading-relaxed">{t.quote}</blockquote>
            <div className="flex items-center justify-between gap-3">
              <p><span className="block text-sm font-semibold">{t.name}</span><span className="text-xs text-muted-foreground">{t.city}</span></p>
              <Stars value={t.rating} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Sample testimonials for the demo store.</p>
    </section>
  )
}
