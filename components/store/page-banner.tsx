import type { ReactNode } from "react"

/** Soft branded header band used at the top of list and information pages. */
export function PageBanner({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/[0.04] to-card p-6 sm:p-8">
      <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 size-52 rounded-full bg-primary/10" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-24 size-40 rounded-full bg-primary/[0.06]" />
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="store-title !text-3xl">{title}</h1>
        {children}
      </div>
      {intro && <p className="relative mt-2 max-w-2xl text-muted-foreground">{intro}</p>}
    </header>
  )
}
