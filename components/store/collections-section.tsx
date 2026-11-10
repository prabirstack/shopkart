import Link from "next/link"
import { ArrowRight, Heart } from "lucide-react"
import { SectionHeader } from "./section-header"
import { collections } from "@/features/catalog/demo"

export function CollectionsSection() {
  return (
    <section aria-labelledby="choice-heading">
      <SectionHeader id="choice-heading" title={<><Heart className="size-6 text-primary" aria-hidden="true" /> Buyer&apos;s Choice</>} href="/collections" linkLabel="View Collection">
        <span className="hidden text-sm text-muted-foreground sm:inline">Handpicked favorites loved by our customers</span>
      </SectionHeader>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map(({ title, note, href, icon: Icon, tint }) => (
          <li key={title}>
            <Link href={href} className={`relative flex h-full min-h-28 items-center overflow-hidden rounded-xl p-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 ${tint}`}>
              <div className="relative z-10">
                <h3 className="font-bold leading-tight">{title}</h3>
                {note && <p className="mt-1 text-sm">{note}</p>}
              </div>
              <Icon className="absolute -right-1 bottom-0 size-20 opacity-30" strokeWidth={1} aria-hidden="true" />
              <span className="absolute bottom-3 right-3 z-10 grid size-6 place-items-center rounded-full bg-foreground text-background">
                <ArrowRight className="size-3.5" aria-hidden="true" />
                <span className="sr-only">Open {title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
