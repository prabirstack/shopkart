import type { Metadata } from "next"
import { Suspense } from "react"
import { InfoPage } from "@/components/info/info-page"
import { UnsubscribeButton } from "@/features/contact/unsubscribe-button"

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } }
export const instant = false

async function Content({ searchParams }: { searchParams: PageProps<"/newsletter/unsubscribe">["searchParams"] }) {
  const raw = (await searchParams).token
  const token = typeof raw === "string" ? raw : ""
  return <UnsubscribeButton token={token} />
}

export default function UnsubscribePage({ searchParams }: PageProps<"/newsletter/unsubscribe">) {
  return (
    <InfoPage title="Unsubscribe" intro="Stop receiving ShopKart newsletters.">
      <Suspense fallback={null}><Content searchParams={searchParams} /></Suspense>
    </InfoPage>
  )
}
