import { Suspense } from "react"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { PageBanner } from "@/components/store/page-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { CompareView } from "@/features/compare/compare-view"

export default function ComparePage() {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-5 py-6">
      <StoreBreadcrumbs trail={[{ label: "Compare" }]} />
      <PageBanner title="Compare products" intro="See prices, ratings and specifications side by side. Differences are highlighted." />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}><CompareView /></Suspense>
    </main>
  )
}
