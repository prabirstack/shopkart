import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { categories } from "@/features/catalog/demo"

/**
 * Friendly empty state for cart, checkout and similar dead ends: an icon on a soft glow, a clear message,
 * one primary action and quick links to popular categories so there is always somewhere to go next.
 */
export function StoreEmptyState({ icon: Icon, title, text, primary, secondary, suggest = true }: {
  icon: LucideIcon; title: string; text: string; primary: { href: string; label: string }; secondary?: { href: string; label: string }; suggest?: boolean
}) {
  return (
    <section aria-labelledby="empty-title" className="relative isolate grid justify-items-center gap-5 overflow-hidden rounded-3xl border bg-card px-5 py-14 text-center shadow-sm sm:py-20">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.528_0.202_21.4/0.16)_1px,transparent_0)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-8 -z-10 size-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <span className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-xl shadow-primary/25 ring-8 ring-primary/10"><Icon className="size-9" aria-hidden="true" /></span>
      <div className="grid max-w-md gap-2">
        <h2 id="empty-title" className="section-title">{title}</h2>
        <p className="text-muted-foreground">{text}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={primary.href} className="group inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50">{primary.label}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
        {secondary && <Link href={secondary.href} className="inline-flex h-11 items-center rounded-xl border bg-background px-6 text-sm font-semibold transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50">{secondary.label}</Link>}
      </div>
      {suggest && (
        <div className="mt-2 grid justify-items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Popular right now</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((c) => <li key={c.slug}><Link href={`/products?category=${c.slug}`} className="rounded-full border bg-background px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">{c.short}</Link></li>)}
          </ul>
        </div>
      )}
    </section>
  )
}
