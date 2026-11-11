import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * Shared, restrained page heading with an optional eyebrow and space for page actions.
 */
export function PageBanner({ title, intro, eyebrow, icon: Icon, children }: { title: string; intro?: string; eyebrow?: string; icon?: LucideIcon; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-[#f7f8fa] px-5 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          {(eyebrow || Icon) && (
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              {Icon && <span className="grid size-6 place-items-center"><Icon className="size-3.5" aria-hidden="true" /></span>}
              {eyebrow}
            </p>
          )}
          <h1 className="store-title">{title}</h1>
          {intro && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{intro}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </header>
  )
}
