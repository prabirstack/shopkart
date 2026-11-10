import type { ReactNode } from "react"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"

/** Shared frame for help, company and legal pages: breadcrumbs, title, readable width. */
export function InfoPage({ title, intro, trail, children, wide = false }: {
  title: string; intro?: string; trail?: { label: string; href?: string }[]; children: ReactNode; wide?: boolean
}) {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6">
      <StoreBreadcrumbs trail={[...(trail ?? []), { label: title }]} />
      <header className="grid max-w-3xl gap-2">
        <h1 className="store-title !text-3xl">{title}</h1>
        {intro && <p className="text-muted-foreground">{intro}</p>}
      </header>
      <div className={`grid min-w-0 gap-6 ${wide ? "" : "max-w-3xl"}`}>{children}</div>
    </main>
  )
}

export function Prose({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id ?? title.toLowerCase().replace(/\W+/g, "-")} className="grid gap-2">
      <h2 id={id ?? title.toLowerCase().replace(/\W+/g, "-")} className="section-title">{title}</h2>
      <div className="grid gap-3 text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">{children}</div>
    </section>
  )
}

/** Banner for starter text that still needs a real review before launch. */
export function DraftNotice({ children }: { children: ReactNode }) {
  return <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{children}</p>
}
