import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * Branded hero used at the top of list and information pages: layered gradient, a faded dot grid,
 * two soft glows, an optional eyebrow chip and room for actions or stats on the right.
 */
export function PageBanner({ title, intro, eyebrow, icon: Icon, children }: { title: string; intro?: string; eyebrow?: string; icon?: LucideIcon; children?: ReactNode }) {
  return (
    <header className="relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.12] via-card to-primary/[0.04] px-5 py-8 shadow-sm sm:px-10 sm:py-12">
      {/* dot grid, fading out toward the lower left */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.528_0.202_21.4/0.22)_1px,transparent_0)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom_left,black,transparent_65%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-primary/15 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 size-64 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          {(eyebrow || Icon) && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 py-1 pl-1.5 pr-3 text-xs font-semibold text-primary shadow-xs backdrop-blur">
              {Icon && <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Icon className="size-3.5" aria-hidden="true" /></span>}
              {eyebrow}
            </p>
          )}
          <h1 className="store-title">{title}</h1>
          {intro && <p className="mt-3 text-base text-muted-foreground sm:text-lg">{intro}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </header>
  )
}
