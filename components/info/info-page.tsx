import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { PageBanner } from "@/components/store/page-banner"

/** Shared frame for help, company and legal pages: breadcrumbs, title, readable width. */
export function InfoPage({ title, intro, eyebrow, icon, trail, children, wide = false }: {
  title: string; intro?: string; eyebrow?: string; icon?: LucideIcon; trail?: { label: string; href?: string }[]; children: ReactNode; wide?: boolean
}) {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6">
      <StoreBreadcrumbs trail={[...(trail ?? []), { label: title }]} />
      <PageBanner title={title} intro={intro} eyebrow={eyebrow} icon={icon} />
      <div className={`grid min-w-0 gap-6 ${wide ? "" : "max-w-3xl"}`}>{children}</div>
    </main>
  )
}

export function Prose({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id ?? title.toLowerCase().replace(/\W+/g, "-")} className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs sm:p-7">
      <h2 id={id ?? title.toLowerCase().replace(/\W+/g, "-")} className="section-title flex items-center gap-3 before:h-6 before:w-1 before:rounded-full before:bg-primary">{title}</h2>
      <div className="grid gap-3 leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_li]:marker:text-primary [&_strong]:text-foreground">{children}</div>
    </section>
  )
}

/** Banner for starter text that still needs a real review before launch. */
export function DraftNotice({ children }: { children: ReactNode }) {
  return <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{children}</p>
}
