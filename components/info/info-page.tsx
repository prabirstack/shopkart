import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { PageBanner } from "@/components/store/page-banner"

/** Shared frame for help, company and legal pages: breadcrumbs, title, readable width. */
export function InfoPage({ title, intro, eyebrow, icon, trail, children, wide = false, aside }: {
  title: string; intro?: string; eyebrow?: string; icon?: LucideIcon; trail?: { label: string; href?: string }[]; children: ReactNode; wide?: boolean; /** Sticky side panel on large screens (below the content on small ones). */ aside?: ReactNode
}) {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6">
      <StoreBreadcrumbs trail={[...(trail ?? []), { label: title }]} />
      <PageBanner title={title} intro={intro} eyebrow={eyebrow} icon={icon} />
      {aside ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid min-w-0 gap-6">{children}</div>
          <div className="grid gap-4 lg:sticky lg:top-4">{aside}</div>
        </div>
      ) : <div className={`grid min-w-0 gap-6 ${wide ? "" : "max-w-3xl"}`}>{children}</div>}
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

/** Closing call to action for info pages: a bold crimson band with one primary and one secondary link. */
export function CtaBand({ title, text, primary, secondary }: { title: string; text: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <section aria-label={title} className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-8 text-primary-foreground shadow-lg shadow-primary/20 sm:px-10 sm:py-10">
      <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 -z-10 size-56 rounded-full bg-white/10" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-1/4 -z-10 size-48 rounded-full bg-black/10" />
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="max-w-xl"><h2 className="section-title">{title}</h2><p className="mt-1.5 text-primary-foreground/85">{text}</p></div>
        <div className="flex flex-wrap gap-3">
          <Link href={primary.href} className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-primary shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-white/60">{primary.label}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
          {secondary && <Link href={secondary.href} className="inline-flex h-11 items-center rounded-xl border border-white/40 px-5 text-sm font-semibold transition-colors hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-white/60">{secondary.label}</Link>}
        </div>
      </div>
    </section>
  )
}

/** Side panel for policy and company pages: where to go with questions. */
export function HelpAside({ note }: { note?: string }) {
  return (
    <>
      <aside className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg shadow-primary/20">
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 -z-10 size-40 rounded-full bg-white/10" />
        <p className="text-lg font-semibold">Questions about this?</p>
        <p className="mt-1.5 text-sm text-primary-foreground/85">A real person replies within one working day, Monday to Saturday.</p>
        <Link href="/contact" className="group mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-primary shadow-md transition-all hover:-translate-y-0.5">Contact us<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
      </aside>
      <nav aria-label="Related pages" className="rounded-3xl border bg-card p-3 shadow-xs">
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related</p>
        <ul className="grid">{[["Help centre", "/help"], ["Returns & refunds", "/help/returns"], ["Privacy policy", "/privacy"], ["Terms & conditions", "/terms"]].map(([l, h]) => (
          <li key={h}><Link href={h} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-primary/5 hover:text-primary">{l}<ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" /></Link></li>
        ))}</ul>
      </nav>
      {note && <p className="px-2 text-xs text-muted-foreground">{note}</p>}
    </>
  )
}
