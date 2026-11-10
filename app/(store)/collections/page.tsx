import type { Metadata } from "next"
import Link from "next/link"
import { PageBanner } from "@/components/store/page-banner"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { collections } from "@/features/catalog/collections"

export const metadata: Metadata = { title: "Collections", description: "Handpicked collections: work from home, fitness at home, smart kitchen and travel essentials.", alternates: { canonical: "/collections" } }

export default function CollectionsPage() {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-4 py-6">
      <StoreBreadcrumbs trail={[{ label: "Collections" }]} />
      <PageBanner title="Buyer's Choice collections" intro="Handpicked favourites loved by our customers." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {collections.map(({ title, note, href, icon: Icon, tint }) => (
          <li key={title}>
            <Link href={href} className={`relative flex min-h-36 items-center overflow-hidden rounded-xl p-6 ${tint}`}>
              <div className="relative z-10"><h2 className="text-xl font-bold">{title}</h2>{note && <p className="mt-1">{note}</p>}</div>
              <Icon className="absolute -right-2 bottom-0 size-32 opacity-25" strokeWidth={1} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
