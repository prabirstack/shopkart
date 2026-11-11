import Link from "next/link"
import Image from "next/image"
import { campaignImage } from "@/features/catalog/images"
import { ArrowRight, Heart } from "lucide-react"
import { SectionHeader } from "./section-header"
import { collections } from "@/features/catalog/collections"

export function CollectionsSection() {
  return (
    <section aria-labelledby="choice-heading">
      <SectionHeader id="choice-heading" title={<><Heart className="size-6 text-primary" aria-hidden="true" /> Buyer&apos;s Choice</>} href="/collections" linkLabel="View Collection">
        <span className="hidden text-sm text-muted-foreground sm:inline">Handpicked favorites loved by our customers</span>
      </SectionHeader>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map(({ title, note, href, icon: Icon, tint, imageId }) => (
          <li key={title}>
            <Link href={href} className={`group/col relative flex aspect-[3/1] w-full items-center overflow-hidden rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 ${tint}`}>
              <div className="relative z-10 max-w-[54%]">
                <h3 className="font-bold leading-tight">{title}</h3>
                {note && <p className="mt-1 text-sm">{note}</p>}
              </div>
              {campaignImage(imageId) ? <span className="absolute inset-0"><Image src={campaignImage(imageId)!} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-contain transition-transform duration-500 group-hover/col:scale-105" /></span> : <Icon className="absolute -right-1 bottom-0 size-20 opacity-30 transition-transform duration-500 group-hover/col:scale-125 group-hover/col:-rotate-6" strokeWidth={1} aria-hidden="true" />}
              <span className="absolute bottom-3 right-3 z-10 grid size-6 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover/col:translate-x-1">
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
